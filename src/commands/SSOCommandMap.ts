import { SSOCommand } from "./SSOCommand";
import { ShowToDo } from "./showToDo";
import { ShowUserGrade } from "./showUserGrade";
import { ShowUserProfile } from "./showUserProfile";
import { ShowAnnouncement } from "./showAnnouncement";


export const SSOCommands: SSOCommand[] = [
  new ShowAnnouncement(),
  new ShowUserProfile(),
  new ShowUserGrade(),
  new ShowToDo(),
];

export const SSOCommandMap: Map<string, SSOCommand> = new Map(
  SSOCommands.map((command) => [command.commandMessage, command])
);
