import { Activity, CardFactory, MessageFactory, TurnContext } from "botbuilder";
import * as ACData from "adaptivecards-templating";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { TodoTask } from "@microsoft/microsoft-graph-types";
import taskCreatedCard from "../adaptiveCards/addToDoCommand.json";
import { TurnState } from "@microsoft/teams-ai";
import { Command } from "..";

export default new Command({
    name: "addtodo",
    sso: true,
    run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {

        const ssoToken = ssoTokenOrState as string;
        if (typeof ssoToken !== 'string') {
            return "Internal error: Missing SSO token.";
        }

        const graph = new GraphApiBuilder(ssoToken);

        const lists = await graph.get<{ value: { id: string; displayName: string }[] }>("/me/todo/lists");
        const defaultList = lists.value?.[0];

        if (!defaultList) {
            return MessageFactory.text("⚠️ Could not find your To Do lists in Microsoft Graph.");
        }

        const taskPayload: TodoTask = {
            title: "New Task from Bot",
            importance: "normal",
            body: {
                content: "This task was created using Microsoft Graph API.",
                contentType: "text",
            },
        } as TodoTask;

        const created = await graph.post<TodoTask, TodoTask>(
            `/me/todo/lists/${defaultList.id}/tasks`,
            taskPayload
        );

        const cardJson = new ACData.Template(taskCreatedCard).expand({
            $root: {
                title: created.title ?? "Untitled Task",
                description:
                    (typeof created.body?.content === "string"
                        ? created.body.content
                        : "") || "Task created successfully.",
                importance: created.importance ?? "normal",
                link: (created as any)?.webLink ?? "https://to-do.microsoft.com/tasks/",
            },
        });

        return MessageFactory.attachment(CardFactory.adaptiveCard(cardJson));
    }
});