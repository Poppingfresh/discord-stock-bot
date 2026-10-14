import { Message, SendableChannels } from 'discord.js';

// discord.js >=14.16 includes PartialGroupDMChannel in message.channel, which
// has no send(). index.ts filters those out once, so commands get this type.
export type SendableMessage = Message & { channel: SendableChannels };

export const isSendableMessage = (msg: Message): msg is SendableMessage => msg.channel.isSendable();

export interface ICommand {
    name: string;
    helpDescription: string;
    showInHelp: boolean;
    trigger: (message: Message) => boolean;
    command: (message: SendableMessage, services?: any) => Promise<void>;
}
