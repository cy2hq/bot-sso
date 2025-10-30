import { Activity, MessageFactory, TurnContext } from "botbuilder";
import { TodoTask } from "@microsoft/microsoft-graph-types";
import { TurnState } from "@microsoft/teams-ai";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { Command } from "..";

function isDueToday(task: TodoTask): boolean {
    const dateTime = task.dueDateTime?.dateTime;
    if (!dateTime) {
        return false;
    }

    try {
        const normalized = dateTime.endsWith("Z") || dateTime.includes("+") ? dateTime : `${dateTime}Z`;
        const due = new Date(normalized);
        if (isNaN(due.getTime())) {
            return false;
        }

        const today = new Date();
        return due.getUTCFullYear() === today.getUTCFullYear()
            && due.getUTCMonth() === today.getUTCMonth()
            && due.getUTCDate() === today.getUTCDate();
    } catch {
        return false;
    }
}

function formatTask(task: TodoTask): string {
    const title = task.title || "Untitled task";
    const due = task.dueDateTime?.dateTime
        ? task.dueDateTime.dateTime
        : "No due date";
    const importance = task.importance || "normal";

    return `• ${title} (due: ${due}, importance: ${importance})`;
}

export default new Command({
    name: "tasksdue",
    sso: true,
    run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {
        const ssoToken = ssoTokenOrState as string;
        if (typeof ssoToken !== "string") {
            return "Internal error: Missing SSO token.";
        }

        const graph = new GraphApiBuilder(ssoToken);

        const lists = await graph.get<{ value: { id: string; displayName: string }[] }>("/me/todo/lists");
        const defaultList = lists.value?.[0];

        if (!defaultList) {
            return MessageFactory.text("No To Do lists were found in your Microsoft To Do.");
        }

        const tasksResponse = await graph.get<{ value: TodoTask[] }>(
            `/me/todo/lists/${defaultList.id}/tasks?$top=50&$orderby=dueDateTime/dateTime`
        );

        const tasksToday = (tasksResponse.value || [])
            .filter((task) => task.status !== "completed")
            .filter(isDueToday)
            .slice(0, 3);

        if (tasksToday.length === 0) {
            return MessageFactory.text("You have no tasks due today.");
        }

        const listName = defaultList.displayName || "Default list";
        const body = [`Top tasks due today from **${listName}**:`, ...tasksToday.map(formatTask)].join("\n");

        return MessageFactory.text(body);
    }
});
