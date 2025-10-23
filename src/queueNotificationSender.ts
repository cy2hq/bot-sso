import { AzureFunction, Context } from "@azure/functions";
import { notificationApp } from "./internal/initialize";
import * as ACData from "adaptivecards-templating";
import { MessageFactory, CardFactory, ResourceResponse } from "botbuilder";
import { AdaptiveCardBuilder } from "./adaptiveCardBuilder";

interface NotificationMessage {
  userId: string;
  eventId: number;
  messageId: string | null;
  data: any;
}

async function parseMessage(message: unknown): Promise<NotificationMessage> {
  return typeof message === "string"
    ? (JSON.parse(message) as NotificationMessage)
    : (message as NotificationMessage);
}

async function sendCardToTarget(
  context: Context,
  target: any,
  eventId: number,
  responseJson: string,
  aadId: string
): Promise<boolean> {
  const builder = await AdaptiveCardBuilder.init(eventId);
  if (builder == null) {
    await target.sendMessage(`Could not initiate adaptive card builder!`);
    return false;
  }

  const card: ACData.Template | null = await builder.build(responseJson);
  if (card == null) {
    context.log?.info?.('Card did not compile successfully!');
    return false;
  }

  const cardActivity = {
    attachments: [CardFactory.adaptiveCard(card)],
    summary: builder.getSummary() ?? "Received a new notification!"
  };

  let cardMessage: ResourceResponse | null = null;
  try {
    await target.adapter.continueConversationAsync(
      target.botAppId,
      target.conversationReference,
      async (ctx) => {
        cardMessage = (await ctx.sendActivity(cardActivity)) ?? null;
      }
    );
  } catch (err) {
    context.log?.error?.("Error sending initial card:", err as any);
    return false;
  }

  if (cardMessage == null) {
    context.log?.info?.('Message was not sent!');
    return false;
  }

  const cardWithActions = await builder.buildActions(
    responseJson,
    cardMessage.id,
    aadId
  );

  const updatedCard = MessageFactory.text('');
  updatedCard.attachments = [CardFactory.adaptiveCard(cardWithActions)];
  updatedCard.id = cardMessage.id;

  try {
    await target.adapter.continueConversationAsync(
      target.botAppId,
      target.conversationReference,
      async (ctx) => {
        await ctx.updateActivity(updatedCard);
      }
    );
  } catch (err) {
    context.log?.error?.("Error updating card with actions:", err as any);
    return false;
  }

  return true;
}

const serviceBusQueueTrigger: AzureFunction = async function (
  context: Context,
  message: unknown
): Promise<void> {
  const { userId, eventId, messageId, data } = await parseMessage(message);
  context.log(`Received notification for user: ${userId}`);
  context.log(`Event ID: ${eventId}, Message ID: ${messageId}`);
  console.log(`Data: ${JSON.stringify(data)}`);

  if (notificationApp.notification == null) {
    context.log.error("NotificationApp is not configured for notifications.");
    return;
  }

  const pageSize = 100;
  let continuationToken: string | undefined;
  let sent = false;
  const responseJson = JSON.stringify(data);

  // Page through installations to find this user
  do {
    const paged = await notificationApp.notification.getPagedInstallations(
      pageSize,
      continuationToken
    );
    continuationToken = paged.continuationToken;

    for (const target of paged.data) {
      const aadId = target.conversationReference?.user?.aadObjectId;
      if (aadId === userId) {
        const ok = await sendCardToTarget(context, target, eventId, responseJson, aadId);
        if (ok) {
          sent = true;
          break;
        }
        // if not ok, continue searching other installations
      } else {
        const logAad = target.conversationReference?.user?.aadObjectId ?? "<unknown user>";
        context.log.warn(`Installation for ${logAad}, not found.`);
      }
    }
  } while (continuationToken && !sent);

  if (!sent) {
    context.log.warn(`Error: Message not sent to: ${userId}`);
  }
};

export default serviceBusQueueTrigger;
