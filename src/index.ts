import express from "express";
import * as fs from "node:fs/promises";
import * as path from "node:path";
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
import { MessageBus } from "./services/MessageBus";
import { AdaptiveCardBuilder } from "./services/AdaptiveCardBuilder";
import * as ACData from "adaptivecards-templating";
import { AppDataSource } from "./internal/data-source";
import OpenAI from "openai";

// --- Type Definitions ---
type CommandRunFunction = (context: TurnContext, tokenOrState: string | TurnState) => Promise<string | Partial<import("botbuilder").Activity>>;

interface ICommandProps {
  name: string;
  sso: boolean;
  run: CommandRunFunction;
}

export class Command implements ICommandProps {
  public name: string;
  public sso: boolean;
  public run: CommandRunFunction;

  constructor(props: ICommandProps) {
    this.name = props.name;
    this.sso = props.sso;
    this.run = props.run;
  }
}

interface NotificationMessage {
  conversationId: string;
  message?: string;
  card?: string;
  userId: string;
  eventId: number;
  messageId?: string;
  data: any;
}

// --- Dynamic Command Loading ---
interface MappedCommand {
  instance: Command;
  wrapper: (context: TurnContext, state: TurnState) => Promise<any>;
}
const CommandHandlerMap = new Map<string, MappedCommand>();

async function loadCommands() {
  console.info('Starting dynamic command loading...');
  const commandsDir = path.join(__dirname, 'commands');

  try {
    const files = await fs.readdir(commandsDir);

    for (const file of files) {
      if (file.endsWith('Command.js') || (process.env.NODE_ENV !== 'production' && file.endsWith('.ts'))) {
        const modulePath = path.join(commandsDir, file);
        const commandModule = require(modulePath);

        const exportedCommand: Command = commandModule.default;

        if (!(exportedCommand instanceof Command) || !exportedCommand.name || typeof exportedCommand.run !== 'function') {
          console.error(`Module ${file} does not export a valid 'new Command({...})' object.`);
          continue;
        }
        const commandName = exportedCommand.name.toLowerCase();
        const isSso = exportedCommand.sso;
        const handlerFunction = exportedCommand.run;

        const commandHandlerWrapper: CommandRunFunction = async (context, tokenOrState) => {
          const state = tokenOrState as TurnState;
          const token = state.temp?.authTokens?.['graph'];

          try {
            if (isSso) {
              if (!token) {
                await context.sendActivity(`No auth token found in state. Please sign in to use the '${commandName}' command.`);
                return "Sign in required."; // Return a string to satisfy promise
              }
              // Pass context and token for SSO commands
              const response = await handlerFunction(context, token);
              await context.sendActivity(response);
            } else {
              // Pass context and state for non-SSO commands
              const response = await handlerFunction(context, state);
              await context.sendActivity(response);
            }
          } catch (error) {
            console.error(`Error executing '${commandName}' command:`, error);
            await context.sendActivity(`Sorry, there was an error processing the **${commandName}** command.`);
          }
          return ""
        };

        CommandHandlerMap.set(commandName, {
          instance: exportedCommand,
          wrapper: commandHandlerWrapper
        });
        console.info(`Command loaded: /${commandName} (SSO Required: ${isSso})`);
      }
    }
  } catch (error) {
    console.error('Error loading commands dynamically:', error);
  }
};

// Initialize components
loadCommands().catch(err => {
  console.error("Failed to initialize commands:", err);
});

AppDataSource.initialize();

const messageBus = MessageBus.getInstance();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Express App Setup ---
const expressApp = express();
expressApp.use(express.json());

const conversationReferences: { [key: string]: ConversationReference } = {};

messageBus.on('sendCard', async (data: { context: TurnContext, card: any }) => {
  await messageBus.sendAdaptiveCard(data.context, data.card);
});

const server = expressApp.listen(
  process.env.port || process.env.PORT || 3978,
  () => {
    console.info(
      `\nBot Started, ${expressApp.name} listening to`,
      server.address()
    );
  }
);

// --- Bot Adapter and Application Setup ---
const adapter = new TeamsAdapter(
  {},
  new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: config.botId,
    MicrosoftAppPassword: config.botPassword,
  })
);

const storage = new MemoryStorage();

const app = new ApplicationBuilder()
  .withStorage(storage)
  .withAuthentication(adapter, {
    settings: {
      graph: {
        scopes: ['User.Read', 'Tasks.ReadWrite'],
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
      let text = context.activity.text;
      if (context.activity.type != "message" || !text) return Promise.resolve(true);

      const removedMentionText = TurnContext.removeRecipientMention(context.activity);
      if (removedMentionText) {
        text = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      } else {
        text = text.toLowerCase().trim();
      }

      const metadata = CommandHandlerMap.get(text);
      return Promise.resolve(context.activity.type === "message" && metadata?.instance.sso === true);
    },
  })
  .build();

// --- API Endpoints ---
expressApp.post("/api/notify", async (req, res) => {
  try {
    const { userId, data, eventId } = req.body as NotificationMessage;
    const reference = conversationReferences[userId];

    if (!reference) {
      console.error(`No conversation reference found for ID: ${userId}`);
      return res.status(404).send("Conversation not found.");
    }

    const builder = await AdaptiveCardBuilder.init(eventId);
    if (!builder) {
      return res.status(500).send("No adaptive card builder found for the given event ID.");
    }

    const ACCard: ACData.Template | null = await builder.build(JSON.stringify(data));
    if (!ACCard) {
      console.warn('Card did not compile successfully!');
      return res.status(500).send("Error building adaptive card.");
    }

    const adaptiveCard = CardFactory.adaptiveCard(ACCard);

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

expressApp.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, async (context: TurnContext) => {
    const reference = TurnContext.getConversationReference(context.activity) as ConversationReference;

    if (reference.user?.aadObjectId) {
      conversationReferences[reference.user.aadObjectId] = reference;
      console.info(`Saved conversation reference for ID: ${reference.user.aadObjectId}`);
    }

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

app.adaptiveCards.actionExecute("/.*/", async (context, state, data) => {
  console.log("Adaptive Card Data Received:", data);

  console.log(context, state)

  return "Action completed successfully!";
});

// --- Teams AI Handlers ---
app.message('/reset', async (context: TurnContext, state: TurnState) => {
  state.deleteConversationState();
  await context.sendActivity(`Ok I've deleted the current conversation state.`);
});

app.message('/signout', async (context: TurnContext, state: TurnState) => {
  await app.authentication.signOutUser(context, state);
  await context.sendActivity(`You have signed out`);
});

app.authentication.get('graph').onUserSignInSuccess(async (context: TurnContext) => {
  await context.sendActivity('Successfully logged in');
  await context.sendActivity(`Send the command again to get response: ${context.activity.text}`);
});

app.authentication
  .get('graph')
  .onUserSignInFailure(async (context: TurnContext, _state: TurnState, error: AuthError) => {
    await context.sendActivity('Failed to login');
    await context.sendActivity(`Error message: ${error.message}`);
  });

app.message(/.*/, async (context: TurnContext, state: TurnState) => {
  let txt = context.activity.text;
  const removedMentionText = TurnContext.removeRecipientMention(context.activity);

  if (removedMentionText) {
    txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
  } else {
    txt = txt.toLowerCase().trim();
  }
  
  const mappedCommand = CommandHandlerMap.get(txt);
  if (mappedCommand) {
    try {
      await mappedCommand.wrapper(context, state);
    } catch (error) {
      console.error(`Error executing command handler for '${txt}':`, error);
      await context.sendActivity(`Sorry, there was an error processing the '${txt}' command.`);
    }
  } else {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: txt }],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const botResponse = response.choices[0].message.content;
      if (botResponse) {
        await context.sendActivity(botResponse);
      } else {
        await context.sendActivity("I'm sorry, I couldn't generate a response.");
      }
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      await context.sendActivity("Sorry, I'm having trouble connecting to my brain right now.");
    }
  }
});