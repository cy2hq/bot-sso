// Import required packages
import express from "express";
import path from "path";
import send from "send";
import "isomorphic-fetch";
import { ApplicationBuilder, AuthError, TeamsAdapter, TurnState } from '@microsoft/teams-ai';
import {
  MemoryStorage,
  ConfigurationServiceClientCredentialFactory,
  TurnContext,
  ConversationReference,
  CardFactory,
} from "botbuilder";
import config from "./internal/config";
import { handlePhotoCommand } from "./commands/photoSsoCommand";
import { handleHelloWorldCommand } from "./commands/helloworldCommand";
import { handleProfileCommand } from "./commands/profileSsoCommand";
import { MessageBus } from "./services/MessageBus"
import { AdaptiveCardBuilder } from "./services/AdaptiveCardBuilder";
import * as ACData from "adaptivecards-templating";
import { AppDataSource } from "./internal/data-source";

// Initialize database connection

AppDataSource.initialize()

interface NotificationMessage {
  conversationId: string;
  message?: string;
  card?: string;
  userId: string;
  eventId: number;
  messageId?: string;
  data: any;
}

const messageBus = MessageBus.getInstance();

// Create express application.
const expressApp = express();
expressApp.use(express.json());

const conversationReferences: { [key: string]: ConversationReference } = {};

messageBus.on('sendCard', async (data: { context: TurnContext, card: any }) => {
  await messageBus.sendAdaptiveCard(data.context, data.card);
});

const server = expressApp.listen(
  process.env.port || process.env.PORT || 3978,
  () => {
    console.log(
      `\nBot Started, ${expressApp.name} listening to`,
      server.address()
    );
  }
);

const adapter = new TeamsAdapter(
  {},
  new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: config.botId,
    MicrosoftAppPassword: config.botPassword,
  })
);

// Define storage and application
const storage = new MemoryStorage();
const app = new ApplicationBuilder()
  .withStorage(storage)
  .withAuthentication(adapter, {
    settings: {
      graph: {
        scopes: ['User.Read'],
        msalConfig: {
          auth: {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            authority: `${config.authorityHost}/${config.tenantId}`
          }
        },
        signInLink: `https://${config.botDomain}/auth-start.html`,
        endOnInvalidMessage: true
      }
    },
    autoSignIn: (context) => {
      if (context.activity.type == "message" && (context.activity.text != "profile" && context.activity.text != "photo")) {
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    },
  })
  .build();

expressApp.post("/api/notify", async (req, res) => {
  try {
    const { userId, data, eventId } = req.body as NotificationMessage;
    const reference = conversationReferences[userId];

    console.log(reference);

    if (!reference) {
      console.error(`No conversation reference found for ID: ${userId}`);
      return res.status(404).send("Conversation not found.");
    }

    const responseJson = JSON.stringify(data);
    const builder = await AdaptiveCardBuilder.init(eventId);
    if (builder == null) {
      return res.status(500).send("No adaptive card builder found for the given event ID.");
    }

    const ACCard: ACData.Template | null = await builder.build(responseJson)
    if (ACCard == null) {
      console.log('Card did not compile successfully!');
      return res.status(500).send("Error building adaptive card.");
    }

    const adaptiveCard = CardFactory.adaptiveCard(ACCard);
    console.log(adaptiveCard);

    await adapter.continueConversationAsync(
      config.botId,
      reference,
      async (context) => {
        context.sendActivity({ attachments: [adaptiveCard] }).catch((error) => {
          console.error('Error sending adaptive card:', error);
        });
      }
    );

    res.status(200).send("Message sent successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending message");
  }
});

// Listen for user to say '/reset' and then delete conversation state
app.message('/reset', async (context: TurnContext, state: TurnState) => {
  state.deleteConversationState();
  await context.sendActivity(`Ok I've deleted the current conversation state.`);
});

app.message('/signout', async (context: TurnContext, state: TurnState) => {
  await app.authentication.signOutUser(context, state);

  // Echo back users request
  await context.sendActivity(`You have signed out`);
});

app.message("photo", async (context: TurnContext, state: TurnState) => {
  const token = state.temp.authTokens['graph'];
  if (!token) {
    await context.sendActivity('No auth token found in state. Authentication failed.');
    return;
  }

  const response = await handlePhotoCommand(context, token);
  await context.sendActivity(response);
});

app.message("helloworld", async (context: TurnContext, state: TurnState) => {
  const response = await handleHelloWorldCommand(context);
  await context.sendActivity(response);
});

app.message("profile", async (context: TurnContext, state: TurnState) => {
  const token = state.temp.authTokens['graph'];
  if (!token) {
    await context.sendActivity('No auth token found in state. Authentication failed.');
    return;
  }

  const response = await handleProfileCommand(context, token);
  await context.sendActivity(response);
});

app.authentication.get('graph').onUserSignInSuccess(async (context: TurnContext, state: TurnState) => {
  // Successfully logged in
  await context.sendActivity('Successfully logged in');
  await context.sendActivity(`Send the command again to get response: ${context.activity.text}`);
});

app.authentication
  .get('graph')
  .onUserSignInFailure(async (context: TurnContext, _state: TurnState, error: AuthError) => {
    // Failed to login
    await context.sendActivity('Failed to login');
    await context.sendActivity(`Error message: ${error.message}`);
  });

// Register an API endpoint with `express`. Teams sends messages to your application
// through this endpoint.
//
// The Microsoft 365 Agents Toolkit bot registration configures the bot with `/api/messages` as the
// Bot Framework endpoint. If you customize this route, update the Bot registration
// in `templates/azure/provision/botservice.bicep`.
// Process Teams activity with Bot Framework.
expressApp.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, async (context: TurnContext) => {
    const reference = TurnContext.getConversationReference(context.activity) as ConversationReference;

    if (reference.user?.aadObjectId) {
      conversationReferences[reference.user.aadObjectId] = reference;
      console.log(`Saved conversation reference for ID: ${reference.user.aadObjectId}`);
    }

    // 3. Continue running the application logic
    await app.run(context);
  });
});

expressApp.get(["/auth-start.html", "/auth-end.html"], async (req, res) => {
  send(
    req,
    path.join(
      __dirname,
      "public",
      req.url.includes("auth-start.html") ? "auth-start.html" : "auth-end.html"
    )
  ).pipe(res);
});
