import {
  TeamsActivityHandler,
  TurnContext,
  SigninStateVerificationQuery,
  MemoryStorage,
  ConversationState,
  UserState,
  StatePropertyAccessor,
  ActivityHandler,
} from "botbuilder";
import OpenAI from "openai";
import { SSODialog } from "./ssoDialog";
import { SSOCommandMap } from "./commands/SSOCommandMap";

export interface ChatMessage {
  from: "user" | "bot";
  message: string;
}

export class TeamsBot extends ActivityHandler {
  private historyAccessor: StatePropertyAccessor<ChatMessage[]>;
  private openai: OpenAI;

  //conversationState: ConversationState;
  userState: UserState;
  dialog: SSODialog;
  dialogState: StatePropertyAccessor;

  constructor(
    private conversationState: ConversationState,
    private apiKey: string,
    private vectorStoreId: string = "vs_68b821a39d6481919d39009cd23c9035"
  ) {
    super();

    // Define the state store for your bot.
    // See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
    // A bot requires a state storage system to persist the dialog and user state between messages.
    const memoryStorage = new MemoryStorage();

    // Create conversation and user state with in-memory storage provider.
    //this.conversationState = new ConversationState(memoryStorage);
    this.userState = new UserState(memoryStorage);
    this.dialog = new SSODialog(new MemoryStorage());
    this.dialogState = this.conversationState.createProperty("DialogState");

    this.historyAccessor = this.conversationState.createProperty<ChatMessage[]>("history");
    this.openai = new OpenAI({ apiKey: this.apiKey });

    this.onMessage(this.onMessageHandler.bind(this));
    // this.onMessage(async (context, next) => {
    //   console.log("Running with Message Activity.");

    //   let txt = context.activity.text;
    //   // remove the mention of this bot
    //   const removedMentionText = TurnContext.removeRecipientMention(
    //     context.activity
    //   );
    //   if (removedMentionText) {
    //     // Remove the line break
    //     txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
    //   }

    //   // Trigger command by IM text
    //   if (SSOCommandMap.get(txt)) {
    //     await this.dialog.run(context, this.dialogState);
    //   }
    //   // By calling next() you ensure that the next BotHandler is run.
    //   await next();
    // });

    // this.onMembersAdded(async (context, next) => {
    //   const membersAdded = context.activity.membersAdded;
    //   for (let cnt = 0; cnt < membersAdded.length; cnt++) {
    //     if (membersAdded[cnt].id) {
    //       await context.sendActivity("Welcome to the sso bot sample!");
    //       break;
    //     }
    //   }
    //   await next();
    // });
  }

  private async onMessageHandler(context: TurnContext, next: () => Promise<void>) {
      console.log("Running with Message Activity.");

      let txt = context.activity.text;
      // remove the mention of this bot
      const removedMentionText = TurnContext.removeRecipientMention(
        context.activity
      );
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      // Trigger command by IM text
      if (SSOCommandMap.get(txt)) {
        await this.dialog.run(context, this.dialogState);
      } else {
        const history = await this.historyAccessor.get(context, []);
    history.push({ from: "user", message: txt });

    let botReply = "Sorry, I hit an error.";
    try {
      // 2) call OpenAI Responses API with vector store
      const resp = await this.openai.responses.create({
        model: 'gpt-4.1-nano',
        max_output_tokens: 1000,
        reasoning: null,
        temperature: 0.1,
        instructions: `You are a helpful AI assistant. Use the following pieces of context to answer the question of the user. Act as if you are a person not an AI robot. Please keep your responses mostly concise and to the point.

        If the user's question cannot be answered using the provided context, politely respond with the following text in markdown:
        Sorry, I can't answer that question, but my colleagues can!

        "You can contact them through the following channels:
        
        Telephone:
        +31 20 123 4567
        
        WhatsApp Support Channel:
        +31 6 123 45678
        
        Self-Service Address Portal:
        https://selfservice.university.edu
        
        Open Walk-In Hours:
        Monday to Friday, 9:00 a.m. - 4:00 p.m.
        
        Location:
        Student Services Center, Building B, Room."

        Else, return the helpful answer in markdown:
        `,
        input: [
          ...history.map(h => `${h.from === 'user' ? 'User:' : 'Assistant:'} ${h.message}`),
          `User: ${txt}`
        ].join('\n'),
        tools: [
          {
            type: 'file_search',
            vector_store_ids: [this.vectorStoreId],
            max_num_results: 3,
          },
        ],
      });

      botReply = resp.output_text ?? "I couldn't generate a response.";
    } catch (e) {
      console.error("OpenAI RAG call failed:", e);
    }

    // 3) update history + save state
    history.push({ from: "bot", message: botReply });
    await this.historyAccessor.set(context, history);
    await this.conversationState.saveChanges(context);

    // 4) reply in Teams
    await context.sendActivity(botReply);
      }
      // By calling next() you ensure that the next BotHandler is run.
      await next();
  }

  async run(context: TurnContext) {
    await super.run(context);

    // Save any state changes. The load happened during the execution of the Dialog.
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }

  async handleTeamsSigninVerifyState(
    context: TurnContext,
    query: SigninStateVerificationQuery
  ) {
    console.log(
      "Running dialog with signin/verifystate from an Invoke Activity."
    );
    await this.dialog.run(context, this.dialogState);
  }

  async handleTeamsSigninTokenExchange(
    context: TurnContext,
    query: SigninStateVerificationQuery
  ) {
    await this.dialog.run(context, this.dialogState);
  }

  async onSignInInvoke(context: TurnContext) {
    await this.dialog.run(context, this.dialogState);
  }
}
