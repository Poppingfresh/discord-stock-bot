import * as fs from 'fs';

const CALENDAR_PATH = '/home/discord-stock-bot/data/calendar.json';

const IMPACT: Record<number, string> = { 3: 'H', 2: 'M', 1: 'L', 0: '-' };

const DAY_ARGS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri',
};

const TODAY_MAP: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri',
};

const pad = (s: string, n: number) => s.substring(0, n).padEnd(n);

function formatDay(day: { day: string; date: string; events: any[] }): string {
  const header = `${day.day} ${day.date}  (${day.events.length} events)`;
  const sep = '─'.repeat(74);
  const colHeader = `${'Time'.padEnd(9)}${'Release'.padEnd(31)}${'I'.padEnd(4)}${'Per'.padEnd(7)}${'Actual'.padEnd(9)}${'Exp'.padEnd(9)}Prior`;

  const rows = day.events.map((e) =>
    `${pad(e.time, 9)}${pad(e.release, 31)}${(IMPACT[e.impact] ?? '-').padEnd(4)}${pad(e.period, 7)}${pad(e.actual, 9)}${pad(e.expected, 9)}${e.prior}`
  );

  return [header, sep, colHeader, sep, ...rows].join('\n');
}

export function getCalendarBlock(dayArg?: string): { title: string; block: string } | { error: string } {
  if (!fs.existsSync(CALENDAR_PATH)) {
    return { error: 'Calendar not yet scraped. Run `scrapeCalendar.py` first.' };
  }

  const data = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf-8'));

  let targetDay: string;
  if (dayArg && DAY_ARGS[dayArg.toLowerCase()]) {
    targetDay = DAY_ARGS[dayArg.toLowerCase()];
  } else {
    targetDay = TODAY_MAP[new Date().getDay()] ?? '';
    if (!targetDay) {
      return { error: 'No market events on weekends. Try `!econ mon` through `!econ fri`.' };
    }
  }

  const day = data.days.find((d: any) => d.day === targetDay);
  if (!day) {
    return { error: `No data for ${targetDay}. The calendar may not include that day this week.` };
  }

  return {
    title: `Economic Calendar — ${day.day} ${day.date}`,
    block: '```\n' + formatDay(day) + '\n```',
  };
}
