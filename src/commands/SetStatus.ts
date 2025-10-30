import { Activity, MessageFactory, TurnContext } from "botbuilder";
import { TurnState } from "@microsoft/teams-ai";
import { Command } from "..";
import { GraphApiBuilder } from "../services/GraphApiBuilder";
import { randomUUID } from "crypto";

type PresenceAvailability =
    | "Available"
    | "Busy"
    | "DoNotDisturb"
    | "BeRightBack"
    | "Away"
    | "Offline";

const AVAILABILITY_ALIASES: Record<string, PresenceAvailability> = {
    available: "Available",
    free: "Available",
    busy: "Busy",
    focus: "Busy",
    meeting: "Busy",
    dnd: "DoNotDisturb",
    donotdisturb: "DoNotDisturb",
    "do-not-disturb": "DoNotDisturb",
    brb: "BeRightBack",
    "be-right-back": "BeRightBack",
    away: "Away",
    offline: "Offline",
    invisible: "Offline"
};

function parseArguments(context: TurnContext): { availability?: PresenceAvailability; duration?: string } {
    let text = context.activity.text || "";
    const cleaned = TurnContext.removeRecipientMention(context.activity) ?? text;
    text = cleaned.trim();

    if (!text) {
        return {};
    }

    const parts = text.split(/\s+/);
    // Expect command name followed by availability and optional duration (PTxx format in minutes)
    if (parts.length < 2) {
        return {};
    }

    const availabilityInput = parts[1].toLowerCase();
    const availability = AVAILABILITY_ALIASES[availabilityInput] ?? undefined;
    const durationInput = parts.length >= 3 ? parts[2] : undefined;
    const duration = durationInput && durationInput.startsWith("PT") ? durationInput : undefined;

    return { availability, duration };
}

export default new Command({
    name: "setstatus",
    sso: true,
    run: async (context: TurnContext, ssoTokenOrState: string | TurnState): Promise<string | Partial<Activity>> => {
        const ssoToken = ssoTokenOrState as string;
        if (typeof ssoToken !== "string") {
            return "Internal error: Missing SSO token.";
        }

        const { availability, duration } = parseArguments(context);
        if (!availability) {
            const help = "Usage: setstatus <availability> [duration]\n" +
                "Availability options: available, busy, dnd, away, brb, offline.\n" +
                "Optional duration should be an ISO-8601 period (e.g. PT30M for 30 minutes).";
            return MessageFactory.text(help);
        }

        const graph = new GraphApiBuilder(ssoToken);

        const body = {
            sessionId: randomUUID(),
            availability,
            activity: availability,
            expirationDuration: duration ?? "PT1H"
        };

        try {
            await graph.post<unknown, typeof body>("/me/presence/setPresence", body);
            return MessageFactory.text(`Presence updated to **${availability}** for ${body.expirationDuration}.`);
        } catch (error) {
            console.error("Failed to set presence:", error);
            return MessageFactory.text("Failed to update presence. Ensure the app has Presence.ReadWrite permission.");
        }
    }
});
