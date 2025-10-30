import { Activity, MessageFactory, TurnContext } from "botbuilder";
import { Event } from "@microsoft/microsoft-graph-types";
import { TurnState } from "@microsoft/teams-ai";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { Command } from "..";

function formatDateTime(event: Event): string {
    const dateTime = event.start?.dateTime;
    const timeZone = event.start?.timeZone;
    if (!dateTime) {
        return "Unknown start time";
    }

    try {
        // Attempt to create a Date object; append 'Z' if no timezone is supplied.
        const normalized = dateTime.endsWith("Z") || dateTime.includes("+") ? dateTime : `${dateTime}Z`;
        const parsed = new Date(normalized);
        if (!isNaN(parsed.getTime())) {
            return `${parsed.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short"
            })}${timeZone ? ` (${timeZone})` : ""}`;
        }
    } catch {
        // fall through to raw output below
    }

    return timeZone ? `${dateTime} (${timeZone})` : dateTime;
}

export default new Command({
    name: "nextmeeting",
    sso: true,
    run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {
        const ssoToken = ssoTokenOrState as string;
        if (typeof ssoToken !== "string") {
            return "Internal error: Missing SSO token.";
        }

        const graph = new GraphApiBuilder(ssoToken);

        const now = new Date();
        const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const query = `/me/calendarview?startdatetime=${now.toISOString()}&enddatetime=${sevenDaysOut.toISOString()}&$top=1&$orderby=start/dateTime`;

        const response = await graph.get<{ value: Event[] }>(query);
        const next = response.value?.[0];

        if (!next) {
            return MessageFactory.text("No meetings scheduled in the next 7 days.");
        }

        const subject = next.subject || "Untitled meeting";
        const startTime = formatDateTime(next);
        const attendees = (next.attendees || [])
            .map((a) => a.emailAddress?.name || a.emailAddress?.address)
            .filter(Boolean);

        const details = [
            `**${subject}**`,
            `Starts: ${startTime}`,
            attendees.length ? `Attendees: ${attendees.join(", ")}` : undefined,
            next.location?.displayName ? `Location: ${next.location.displayName}` : undefined,
            (next as any).onlineMeetingUrl ? `Join: ${(next as any).onlineMeetingUrl}` : undefined,
            (next as any).webLink ? `Open in Outlook: ${(next as any).webLink}` : undefined
        ]
            .filter(Boolean)
            .join("\n");

        return MessageFactory.text(details);
    }
});
