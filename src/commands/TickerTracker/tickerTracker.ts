import { Message } from 'discord.js';
import { ICommand } from '../../icommand';
import { TickerTracker } from '../../services/tickerTracker';

export const TickerTrackerCommand: ICommand = {
  name: '!top',
  helpDescription: '!top — top tickers overall  |  !top d/w/m — last 24h/7d/30d  |  !top @user — top for a user',
  showInHelp: true,
  trigger: (msg: Message) => msg.content.startsWith('!top'),
  command: async (message: Message) => {
    const argument = message.content.replace('!top', '').trim();
    let tickers;
    let subtitle: string;

    if (argument.startsWith('<@')) {
      const userId = argument.replace(/^<@!?/, '').replace('>', '');
      tickers = TickerTracker.getTickersByUser(10, userId);
      subtitle = `Top tickers for ${argument}`;
    } else if (TickerTracker.DateChars.has(argument)) {
      tickers = TickerTracker.getTickersByTime(10, argument);
      const labels: Record<string, string> = { d: 'last 24h', w: 'last 7 days', m: 'last 30 days' };
      subtitle = `Top tickers — ${labels[argument]}`;
    } else if (argument.length > 0) {
      tickers = TickerTracker.getTickersByUser(10, argument);
      subtitle = `Top tickers for "${argument}"`;
    } else {
      tickers = TickerTracker.getTickers(10);
      subtitle = 'Top tickers — all time';
    }

    if (tickers.length === 0) {
      await message.channel.send('No ticker data found for that filter.');
      return Promise.resolve();
    }

    const fields = tickers.map((ticker, i) => `${i + 1}. **${ticker._id.toUpperCase()}**: ${ticker.count}`);

    await message.channel.send({
      embeds: [{
        author: {
          name: message.client.user.username,
          icon_url: message.client.user.displayAvatarURL(),
        },
        color: 3447003,
        title: 'Top Tickers',
        description: `${subtitle}\n\n${fields.join('\n')}`,
      }],
    });

    return Promise.resolve();
  },
};
