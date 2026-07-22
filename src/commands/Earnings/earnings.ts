import { Message } from 'discord.js';
import { ICommand } from '../../icommand';
import { getEarningsBlock, isDateArg } from './finviz-earnings';
import { getNextEarnings } from './next-earnings';

export const EarningsCommand: ICommand = {
  name: 'Earnings',
  helpDescription: '!earnings [YYYY-MM-DD | MM-DD | TICKER] — top 30 earnings by market cap for a date, or the next earnings date for a ticker',
  showInHelp: true,
  trigger: (msg: Message) => msg.content.startsWith('!earnings'),
  command: async (message: Message) => {
    const arg = message.content.split(' ')[1];

    // A non-date argument is treated as a ticker: look up its next earnings date.
    const isTickerLookup = Boolean(arg) && !isDateArg(arg);
    const result = isTickerLookup
      ? await getNextEarnings(arg)
      : getEarningsBlock(arg);

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
        description: result.description,
        footer:      { text: isTickerLookup ? 'Source: Yahoo Finance' : 'Sorted by market cap · Source: Finviz' },
      }],
    });
  },
};
