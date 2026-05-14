import { Message } from 'discord.js';
import { ICommand } from '../../icommand';
import { getCalendarBlock } from './finviz-calendar';

export const CalendarCommand: ICommand = {
  name: 'Calendar',
  helpDescription: '!econ [day] — economic calendar for today or a specific day (mon/tue/wed/thu/fri)',
  showInHelp: true,
  trigger: (msg: Message) => msg.content.startsWith('!econ'),
  command: async (message: Message) => {
    const dayArg = message.content.split(' ')[1];
    const result = getCalendarBlock(dayArg);

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
