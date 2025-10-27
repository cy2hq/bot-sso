import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { CardFactory, TurnContext } from "botbuilder";
import { OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import { SSOCommand } from "./SSOCommand";
import oboAuthConfig from "../authConfig";

export class ShowToDo implements SSOCommand {
  commandMessage = "todo";

  async operationWithSSOToken(context: TurnContext, ssoToken: string) {
    await context.sendActivity("Fetching your Microsoft To Do tasks...");

    const oboCredential = new OnBehalfOfUserCredential(ssoToken, oboAuthConfig);
    const authProvider = new TokenCredentialAuthenticationProvider(oboCredential, {
      scopes: ["Tasks.ReadWrite"],
    });
    const graphClient = Client.initWithMiddleware({ authProvider });

    const todoLists = await graphClient.api("/me/todo/lists").get();
    if (!todoLists?.value?.length) {
      await context.sendActivity("You don't have any To Do lists yet.");
      return;
    }

    const firstList = todoLists.value[0];
    const tasks = await graphClient.api(`/me/todo/lists/${firstList.id}/tasks`).get();

    const taskItems =
      tasks.value.length > 0
        ? tasks.value.map((t: any) => ({
            type: "TextBlock",
            text: `• ${t.title}`,
            wrap: true,
          }))
        : [{ type: "TextBlock", text: "No tasks yet!" }];

    const cardJson = {
      type: "AdaptiveCard",
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.3", // ✅ Use 1.3 for better Teams support
      body: [
        {
          type: "TextBlock",
          text: "📝 Your To Do Tasks",
          weight: "Bolder",
          size: "Large",
        },
        ...taskItems,
        {
          type: "ActionSet",
          actions: [
            {
              type: "Action.Submit",
              title: "Add a New Task",
              data: { action: "addTodo" },
            },
          ],
        },
      ],
    };

    const card = CardFactory.adaptiveCard(cardJson);
    await context.sendActivity({ attachments: [card] });
  }
}