import { EventEmitter } from 'node:events';
import { TurnContext, CardFactory } from 'botbuilder';

export class MessageBus extends EventEmitter {
    private static instance: MessageBus;

    private constructor() {
        super();
    }

    public static getInstance(): MessageBus {
        if (!MessageBus.instance) {
            MessageBus.instance = new MessageBus();
        }
        return MessageBus.instance;
    }

    public async sendAdaptiveCard(context: TurnContext, card: any) {
        const adaptiveCard = CardFactory.adaptiveCard(card);
        await context.sendActivity({ attachments: [adaptiveCard] });
    }
}