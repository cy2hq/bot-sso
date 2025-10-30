import { Activity, MessageFactory, TurnContext } from "botbuilder";
import { TurnState } from "@microsoft/teams-ai";
import { Command, listCommands } from "..";

export default new Command({
    name: "help",
    sso: false,
    run: async (_context: TurnContext, _state: string | TurnState): Promise<string | Partial<Activity>> => {
        const commands = listCommands();
        if (commands.length === 0) {
            return MessageFactory.text("No commands are currently available.");
        }

        const message = ["Available commands:", ...commands.map((command) => {
            const name = command.name;
            const badge = command.sso ? " (SSO)" : "";
            return `• ${name}${badge}`;
        })].join("\n");

        return MessageFactory.text(message);
    }
});
