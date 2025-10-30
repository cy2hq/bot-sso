import { Activity, MessageFactory, TurnContext } from "botbuilder";
import { DriveItem } from "@microsoft/microsoft-graph-types";
import { TurnState } from "@microsoft/teams-ai";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { Command } from "..";

function formatFile(item: DriveItem): string {
    const name = item.name || "Untitled file";
    const lastModified = item.lastModifiedDateTime || "Unknown date";
    const link = item.webUrl;

    if (link) {
        return `• [${name}](${link}) (modified: ${lastModified})`;
    }

    return `• ${name} (modified: ${lastModified})`;
}

export default new Command({
    name: "recentfiles",
    sso: true,
    run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {
        const ssoToken = ssoTokenOrState as string;
        if (typeof ssoToken !== "string") {
            return "Internal error: Missing SSO token.";
        }

        const graph = new GraphApiBuilder(ssoToken);
        const result = await graph.get<{ value: DriveItem[] }>("/me/drive/recent?$top=3");

        const items = result.value || [];
        if (items.length === 0) {
            return MessageFactory.text("No recent files found.");
        }

        const body = ["Recent files:", ...items.map(formatFile)].join("\n");
        return MessageFactory.text(body);
    }
});
