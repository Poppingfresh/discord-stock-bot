import * as fs from 'fs';

const EARNINGS_PATH = '/home/bot/discord-stock-bot/data/earnings.json';

const pad = (s: string, n: number) => s.substring(0, n).padEnd(n);

function formatEarnings(entries: any[]): string {
  const sep = '─'.repeat(40);
  const colHeader = `${'Ticker'.padEnd(7)}${'Company'.padEnd(29)}When`;
  const rows = entries.map((e) =>
    `${pad(e.ticker, 6)} ${pad(e.name, 28)} ${e.time}`
  );
  return [sep, colHeader, sep, ...rows].join('\n');
}

function parseDate(arg: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) return arg;
  if (/^\d{2}[/-]\d{2}$/.test(arg)) {
    const year = new Date().getFullYear();
    const normalized = arg.replace('/', '-');
    return `${year}-${normalized}`;
  }
  return null;
}

export function getEarningsBlock(dateArg?: string): { title: string; description: string } | { error: string } {
  if (!fs.existsSync(EARNINGS_PATH)) {
    return { error: 'Earnings data not yet scraped. Run `scrapeEarnings.py` first.' };
  }

  const data = JSON.parse(fs.readFileSync(EARNINGS_PATH, 'utf-8'));

  let targetDate: string;
  if (dateArg) {
    const parsed = parseDate(dateArg);
    if (!parsed) {
      return { error: 'Invalid date. Use `YYYY-MM-DD` or `MM-DD` (e.g. `!earnings 2026-05-15` or `!earnings 05-15`).' };
    }
    targetDate = parsed;
  } else {
    targetDate = new Date().toISOString().slice(0, 10);
  }

  const dayData = data.dates?.[targetDate];
  if (!dayData) {
    return { error: `No data for ${targetDate}. Scraped data covers today + ${Object.keys(data.dates ?? {}).length - 1} days.` };
  }

  if (dayData.entries.length === 0) {
    return { error: `No earnings scheduled for ${targetDate}.` };
  }

  return {
    title: `Earnings Calendar — ${targetDate}`,
    description: '```\n' + formatEarnings(dayData.entries) + '\n```',
  };
}
