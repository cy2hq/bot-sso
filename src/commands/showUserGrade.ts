import { ResponseType, Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { CardFactory, TurnContext } from "botbuilder";
import { OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import { SSOCommand } from "./SSOCommand";
import oboAuthConfig from "../authConfig";

export class ShowUserGrade implements SSOCommand {
  commandMessage = "grade";

  async operationWithSSOToken(context: TurnContext, ssoToken: string) {
    await context.sendActivity("Retrieving grade information from Microsoft Graph ...");

    const oboCredential = new OnBehalfOfUserCredential(ssoToken, oboAuthConfig);

    const authProvider = new TokenCredentialAuthenticationProvider(oboCredential, {
      scopes: ["User.Read"],
    });

    const graphClient = Client.initWithMiddleware({ authProvider });

    // 1️⃣ Get the user info
    const me = await graphClient.api("/me").get();

    // 2️⃣ (Optional) Get an assignment and its grade from Microsoft Graph
    // For demo, we'll use sample data. Replace this with a real Graph call:
    // const assignments = await graphClient.api("/education/me/assignments").get();
    // const assignment = assignments.value[0];
    // const grade = assignment?.submissions?.[0]?.outcomes?.[0]?.score?.points || "Not graded";

    const assignmentName = "Math Homework #2";
    const grade = "A";

    // 3️⃣ Create the Adaptive Card for the Grade
    const gradeCard = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      body: [
        {
          type: "TextBlock",
          text: "📘 Assignment Grade",
          weight: "Bolder",
          size: "Large",
          color: "Accent"
        },
        {
          type: "TextBlock",
          text: `Student: ${me.displayName}`,
          wrap: true,
          spacing: "Medium"
        },
        {
          type: "TextBlock",
          text: `Assignment: ${assignmentName}`,
          wrap: true
        },
        {
          type: "TextBlock",
          text: `Grade: ${grade}`,
          weight: "Bolder",
          color: "Good",
          size: "Medium"
        }
      ],
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.4"
    });

    await context.sendActivity({ attachments: [gradeCard] });
  }
}
