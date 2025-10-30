import { Activity, MessageFactory, TurnContext } from "botbuilder";
import { DirectoryObject, User } from "@microsoft/microsoft-graph-types";
import { TurnState } from "@microsoft/teams-ai";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { Command } from "..";

interface Manager extends DirectoryObject {
    displayName?: string;
    jobTitle?: string;
    userPrincipalName?: string;
}

export default new Command({
    name: "whoami",
    sso: true,
    run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {
        const ssoToken = ssoTokenOrState as string;
        if (typeof ssoToken !== "string") {
            return "Internal error: Missing SSO token.";
        }

        const graph = new GraphApiBuilder(ssoToken);

        const user = await graph.get<User>("/me?$select=displayName,jobTitle,mail,department,givenName,surname,userPrincipalName,officeLocation");

        const manager = await graph.get<Manager | undefined>("/me/manager?$select=displayName,jobTitle,userPrincipalName").catch(() => undefined);

        const lines = [
            `Display name: ${user.displayName || "Unknown"}`,
            user.jobTitle ? `Job title: ${user.jobTitle}` : undefined,
            user.department ? `Department: ${user.department}` : undefined,
            user.officeLocation ? `Office: ${user.officeLocation}` : undefined,
            user.mail ? `Mail: ${user.mail}` : undefined,
            user.userPrincipalName ? `UPN: ${user.userPrincipalName}` : undefined,
            manager?.displayName ? `Manager: ${manager.displayName}${manager.jobTitle ? ` (${manager.jobTitle})` : ""}` : "Manager: Not set",
        ].filter(Boolean);

        return MessageFactory.text(lines.join("\n"));
    }
});
