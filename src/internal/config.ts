const config = {
  MicrosoftAppId: process.env.BOT_ID,
  MicrosoftAppType: process.env.BOT_TYPE,
  MicrosoftAppTenantId: process.env.BOT_TENANT_ID,
  MicrosoftAppPassword: process.env.BOT_PASSWORD,
  chatbotPipelineId: process.env.CHATBOT_PIPELINE_ID,
  chatbotToken: process.env.CHATBOT_TOKEN,
  StorageConnectionString: process.env.STORAGE_CONN_STRING,
  StorageContainerName: process.env.STORAGE_CONT_NAME,
  openAIKey: process.env.OPENAI_API_KEY,
};

export default config;
