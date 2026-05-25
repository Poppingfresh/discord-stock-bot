import { Message } from 'discord.js';
import { ICommand } from '../../icommand';
import { getCalendarBlock } from './finviz-calendar';

export const CalendarCommand: ICommand = {
  name: 'Calendar',
  helpDescription: '!econ [day] [next] — economic calendar for today or a specific day (mon–fri); add "next" for next week',
  showInHelp: true,
  trigger: (msg: Message) => msg.content.startsWith('!econ'),
  command: async (message: Message) => {
    const parts = message.content.trim().split(/\s+/).slice(1); // drop '!econ'

    let isNext = false;
    let dayArg: string | undefined;

    if (parts.includes('next')) {
      isNext = true;
      dayArg = parts.find((p) => p !== 'next');
    } else {
      dayArg = parts[0];
    }

    const result = getCalendarBlock(dayArg, isNext);

    if ('error' in result) {
      await message.channel.send(result.error);
      return;
    }

    await message.channel.send({
      embeds: [{
        author: {
          name: message.client.user.username,
          icon_url: message.client.user.displayAvatarURL(),
        },
        color: 3447003,
        title: result.title,
        description: result.block,
        footer: { text: 'Source: Finviz Economic Calendar' },
      }],
    });
  },
};
