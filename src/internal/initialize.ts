  import {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    ConversationState,
    createBotFrameworkAuthenticationFromConfiguration,
    MemoryStorage,
    ShowTypingMiddleware
  } from "botbuilder";
  import config from "./config";
  import { TeamsBot } from "../teamsBot";
  import "reflect-metadata"
  import { AppDataSource } from "../data-source";
  import { BotBuilderCloudAdapter } from "@microsoft/teamsfx";
  import ConversationBot = BotBuilderCloudAdapter.ConversationBot;
  import { BlobStore } from "../store/blobStore";

  // Initialize database connection.
  AppDataSource.initialize()

  // — normal messages —
  const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: config.MicrosoftAppId,
    MicrosoftAppPassword: config.MicrosoftAppPassword,
    MicrosoftAppType: config.MicrosoftAppType,
    MicrosoftAppTenantId: config.MicrosoftAppTenantId,
  });
  const botFrameworkAuth = createBotFrameworkAuthenticationFromConfiguration(
    null,
    credentialsFactory
  );

  const memoryStorage = new MemoryStorage();
  const conversationState = new ConversationState(memoryStorage);

  export const adapter = new CloudAdapter(botFrameworkAuth);
  adapter.use(new ShowTypingMiddleware(100, 1500));
  export const bot = new TeamsBot(
    conversationState,
    config.openAIKey!,      
  );

  // Notification app
  export const notificationApp = new ConversationBot({
    adapterConfig: config,
    notification: {
      enabled: true,
      store: new BlobStore(
        config.StorageConnectionString!,
        config.StorageContainerName!
      ),
    },
  });