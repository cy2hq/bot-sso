import { Activity, TurnContext } from "botbuilder";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { User } from "@microsoft/microsoft-graph-types";
import { TurnState } from "@microsoft/teams-ai";
import { Command } from "..";

export default new Command({
  name: "profile",
  sso: true,
  run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {
    const ssoToken = ssoTokenOrState as string;
    if (typeof ssoToken !== 'string') {
      return "Internal error: Missing SSO token.";
    }

    const graph = new GraphApiBuilder(ssoToken);

    const me = await graph.get<User>("/me");

    if (me) {
      // Bot will send the user profile info to user
      return `Your command is '${context.activity.text}' and you're logged in as ${me.displayName
        } (${me.userPrincipalName})${me.jobTitle ? `; your job title is: ${me.jobTitle}` : ""
        }.`;
    } else {
      return "Could not retrieve profile information from Microsoft Graph.";
    }
  }
});