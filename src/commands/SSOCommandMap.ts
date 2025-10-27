import { SSOCommand } from "./SSOCommand";
import { ShowUserGrade } from "./showUserGrade";
import { ShowUserProfile } from "./showUserProfile";


export const SSOCommands: SSOCommand[] = [
  new ShowUserProfile(),
  new ShowUserGrade(),
];

export const SSOCommandMap: Map<string, SSOCommand> = new Map(
  SSOCommands.map((command) => [command.commandMessage, command])
);
