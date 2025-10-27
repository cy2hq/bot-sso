import { ResponseType, Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { CardFactory, TurnContext } from "botbuilder";
import { OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import { SSOCommand } from "./SSOCommand";
import oboAuthConfig from "../authConfig";

export class ShowAnnouncement implements SSOCommand {
  commandMessage = "announcement";

  async operationWithSSOToken(context: TurnContext, ssoToken: string) {
    await context.sendActivity("Fetching latest announcements from Microsoft Graph ...");

    const oboCredential = new OnBehalfOfUserCredential(ssoToken, oboAuthConfig);

    const authProvider = new TokenCredentialAuthenticationProvider(oboCredential, {
      scopes: ["User.Read"],
    });

    const graphClient = Client.initWithMiddleware({ authProvider });

    // 1️⃣ Get the user info
    const me = await graphClient.api("/me").get();

    // 2️⃣ (Optional) Get announcements from Microsoft Graph (e.g., Teams channel messages)
    // Example: const announcements = await graphClient.api("/teams/{team-id}/channels/{channel-id}/messages").get();
    // For now, we’ll use demo data instead:
    const announcements = [
      {
        title: "Semester Results Released",
        content: "Final semester results are now available on the student portal.",
        date: "2025-10-25",
      },
      {
        title: "Upcoming Math Quiz",
        content: "A reminder that Math Quiz #3 will take place on November 2nd.",
        date: "2025-10-27",
      },
    ];

    // 3️⃣ Create Adaptive Cards for announcements
    const announcementCards = announcements.map((item) =>
      CardFactory.adaptiveCard({
        type: "AdaptiveCard",
        body: [
          {
            type: "TextBlock",
            text: "📢 Announcement",
            weight: "Bolder",
            size: "Large",
            color: "Accent",
          },
          {
            type: "TextBlock",
            text: `Title: ${item.title}`,
            wrap: true,
            spacing: "Medium",
            weight: "Bolder",
          },
          {
            type: "TextBlock",
            text: `Date: ${item.date}`,
            wrap: true,
            spacing: "Small",
            color: "Accent",
          },
          {
            type: "TextBlock",
            text: item.content,
            wrap: true,
            spacing: "Medium",
          },
          {
            type: "TextBlock",
            text: `Posted for: ${me.displayName}`,
            isSubtle: true,
            wrap: true,
            spacing: "Medium",
          },
        ],
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.4",
      })
    );

    // 4️⃣ Send all announcements as individual cards
    for (const card of announcementCards) {
      await context.sendActivity({ attachments: [card] });
    }
  }
}
