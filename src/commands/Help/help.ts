import { Message } from 'discord.js';
import { ICommand, SendableMessage } from '../../icommand';

// Hand-written so commands can be grouped and described properly; add new commands here.
// Discord limits: 25 fields, 1024 chars per field value, 6000 chars per embed.
const HELP_FIELDS = [
  {
    name: '📈 Charts',
    value: [
      '`$aapl [d|w|m|h|4h|1|3|15|30] [line] [sma|ema|vwap|borc|hilo|ema12…]` — Finviz chart (default 5-min)',
      '`$/es [timeframe]` — futures chart · `$.btc` — crypto chart',
      '`!sc aapl` — StockCharts daily · `!hm` — market heat map',
    ].join('\n'),
  },
  {
    name: '🔎 Quotes & Fundamentals',
    value: [
      '`!info aapl` — price, summary, news · `!fa aapl` — fundamentals',
      '`!ext aapl` — extended-hours price · `!earnings aapl` — next earnings date',
    ].join('\n'),
  },
  {
    name: '📊 Movers & Screeners — size: `all | mid ($2–10B) | large (>$10B)`',
    value: [
      '`!winners [size]` · `!losers [size]` · `!premarket [size]` · `!afterhours [size]`',
      '`!breakout` · `!screener <finviz url>` · `!stats` — NYSE breadth',
    ].join('\n'),
  },
  {
    name: '📅 Calendars',
    value: [
      '`!events` — today\'s econ releases w/ actual/expected/prior',
      '`!econ [mon–fri] [next]` — week view · `!earnings [YYYY-MM-DD|MM-DD]` — top 30 by mkt cap',
    ].join('\n'),
  },
  {
    name: '🌪️ Volatility',
    value: [
      '`!vix` — VX futures curve · `!vixmodels` — vol model tearsheet · `!vrp` — vol risk premium',
      '`!vixbin` — returns by VIX bin · `!vixnext` — next-day returns · `!rvol aapl` — realized vol',
      '`!cone aapl [start] [end]` — vol cone · `!maxloss aapl` — max-loss z-score',
    ].join('\n'),
  },
  {
    name: '🧪 Analytics',
    value: [
      '`!rel spy qqq iwm [start] [end]` — relative performance · `!corr 5 spy,qqq,^vix` — correlation',
      '`!rrg [1-4]` — relative rotation: 1 sector ETFs · 2 commodities · 3 international · 4 subsector ETFs',
      '`!pairs t1 t2` (see `!pairs help`) · `!cot [ticker]` — Commitment of Traders',
      '`!dressing aapl [start] [end]` — window dressing · `!market` — momentum dashboard',
    ].join('\n'),
  },
  {
    name: '🏆 Community',
    value: '`!top [d|w|m|@user]` — most-requested tickers',
  },
];

export const HelpCommand: ICommand = {
  name: 'Help',
  helpDescription: '!help',
  showInHelp: false,
  trigger: (msg: Message) => msg.content.startsWith('!help'),
  command: async (message: SendableMessage) => {
    try {
      await message.channel.send({
        embeds: [{
          author: {
            name: message.client.user.username,
            icon_url: message.client.user.displayAvatarURL(),
          },
          color: 3447003,
          title: '1-800-GAMBLER is the phone number for the National Problem Gambling Helpline. '
            + 'It serves as a resource for individuals who lack alpha and the spirit of a true investor.',
          description: '`[ ]` = optional',
          fields: HELP_FIELDS,
          footer: { text: 'Dates are YYYY-MM-DD · type "fuck" to delete your last chart' },
        }],
      });
    } catch (error) {
      console.error('HelpCommand send error:', error);
      await message.channel.send('Help is broken right now. Ping a mod.');
    }
  },
};
