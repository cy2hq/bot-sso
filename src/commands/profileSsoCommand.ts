import { Activity, TurnContext } from "botbuilder";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { User } from "@microsoft/microsoft-graph-types";

export async function handleProfileCommand(
  context: TurnContext,
  ssoToken: string
): Promise<string | Partial<Activity>> {
  await context.sendActivity(
    "Retrieving user information from Microsoft Graph ..."
  );

  const graphClient = new GraphApiBuilder(ssoToken);

  // Call graph api use `graph` instance to get user profile information
  const me = await graphClient.get<User>("/me");

  if (me) {
    // Bot will send the user profile info to user
    return `Your command is '${context.activity.text}' and you're logged in as ${
      me.displayName
    } (${me.userPrincipalName})${
      me.jobTitle ? `; your job title is: ${me.jobTitle}` : ""
    }.`;
  } else {
    return "Could not retrieve profile information from Microsoft Graph.";
  }
}
