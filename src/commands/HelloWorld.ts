import { Activity, CardFactory, MessageFactory, TurnContext } from "botbuilder";
import * as ACData from "adaptivecards-templating";
import helloWorldCard from "../adaptiveCards/helloworldCommand.json";
import { TurnState } from "@microsoft/teams-ai";
import { Command } from "..";

export default new Command({
  name: "helloworld",
  sso: true,
  run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {

    const cardJson = new ACData.Template(helloWorldCard).expand({
      $root: {
        title: "Your Hello World App is Running",
        body: "Congratulations! Your Hello World App is running. Open the documentation below to learn more about how to build applications with the Microsoft 365 Agents Toolkit.",
      },
    });

    return MessageFactory.attachment(CardFactory.adaptiveCard(cardJson));
  }
});