import { Message } from 'discord.js';
import { ICommand } from '../../icommand';
import { getEarningsBlock } from './finviz-earnings';

export const EarningsCommand: ICommand = {
  name: 'Earnings',
  helpDescription: '!earnings [YYYY-MM-DD or MM-DD] — top 30 earnings by market cap for today or a specific date',
  showInHelp: true,
  trigger: (msg: Message) => msg.content.startsWith('!earnings'),
  command: async (message: Message) => {
    const dateArg = message.content.split(' ')[1];
    const result  = getEarningsBlock(dateArg);

    if ('error' in result) {
      await message.channel.send(result.error);
      return;
    }

    await message.channel.send({
      embeds: [{
        author: {
          name:     message.client.user.username,
          icon_url: message.client.user.displayAvatarURL(),
        },
        color:       3447003,
        title:       result.title,
        description: result.block,
        footer:      { text: 'Sorted by market cap · Source: Finviz' },
      }],
    });
  },
};
