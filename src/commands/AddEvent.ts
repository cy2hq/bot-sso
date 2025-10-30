import { Activity, CardFactory, MessageFactory, TurnContext } from "botbuilder";
import * as ACData from "adaptivecards-templating";
import { Event } from "@microsoft/microsoft-graph-types";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import assignmentCreatedCard from "../adaptiveCards/assignmentCreatedCard.json";
import { Command } from "..";
import { TurnState } from "@microsoft/teams-ai";

function stripHtml(html?: string): string {
    return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default new Command({
    name: "addevent",
    sso: true,
    run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {

        const ssoToken = ssoTokenOrState as string;
        if (typeof ssoToken !== 'string') {
            return "Internal error: Missing SSO token.";
        }

        const graph = new GraphApiBuilder(ssoToken);

        // Example payload, adapt as needed or map from user input
        const now = new Date();
        const start = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
        const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 minutes

        const eventPayload: Event = {
            subject: "New Assignment",
            body: {
                contentType: "text",
                content: "An assignment has been created and added to your calendar.",
            },
            start: {
                dateTime: start.toISOString(),
                timeZone: "UTC",
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: "UTC",
            },
            location: { displayName: "Online" },
            allowNewTimeProposals: true,
        } as Event;

        try {
            // POST /me/events
            const created = await graph.post<Event, Event>("/me/events", eventPayload);

            const rawDescription = (created as any).bodyPreview ||
                (typeof created.body?.content === "string" ? created.body.content : "");

            const cardJson = new ACData.Template(assignmentCreatedCard).expand({
                $root: {
                    title: created.subject ?? "Assignment",
                    dueDate: created.end?.dateTime ?? end.toISOString(),
                    description: stripHtml(rawDescription) || "Assignment created and scheduled.",
                    calendarUrl: (created as any).webLink ?? "https://outlook.office.com/calendar/",
                },
            });

            return MessageFactory.attachment(CardFactory.adaptiveCard(cardJson));
        } catch (err: any) {
            console.error("Failed to create event:", err?.message ?? err);
            return "Failed to create calendar event. Ensure Calendars.ReadWrite permission is granted.";
        }
    }
});