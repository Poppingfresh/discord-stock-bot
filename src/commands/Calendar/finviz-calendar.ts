import * as fs from 'fs';

const CALENDAR_PATH = '/home/bot/discord-stock-bot/data/calendar.json';
const WEEKEND_EVENTS_PATH = '/home/bot/discord-stock-bot/data/weekend-events.json';

const DAY_ARGS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri',
  sat: 'Sat', sun: 'Sun',
};

const TODAY_MAP: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

const IMPACT: Record<number, string> = { 3: 'H', 2: 'M', 1: 'L', 0: '-' };

const WEEKEND_TIMES = ['9:00AM', '10:30AM', '12:00PM', '1:30PM', '3:00PM', '4:30PM', '6:00PM', '8:00PM'];
const WEEKEND_IMPACTS = [3, 3, 2, 2, 2, 1];

function buildWeekendEvents(): { time: string; release: string; impact: number }[] {
  let pool: string[] = [];
  if (fs.existsSync(WEEKEND_EVENTS_PATH)) {
    try {
      pool = JSON.parse(fs.readFileSync(WEEKEND_EVENTS_PATH, 'utf-8'));
    } catch { pool = []; }
  }

  if (pool.length === 0) return [];

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picks = shuffled.slice(0, Math.min(6, shuffled.length));

  return picks.map((release, i) => ({
    time: WEEKEND_TIMES[i] ?? `${i + 9}:00AM`,
    release,
    impact: WEEKEND_IMPACTS[i] ?? 1,
  }));
}

const pad = (s: string, n: number) => s.substring(0, n).padEnd(n);

function formatDay(day: { day: string; date: string; events: any[] }): string {
  const header = `${day.day} ${day.date}  (${day.events.length} events)`;
  const sep = '─'.repeat(36);
  const colHeader = `${'Time'.padEnd(8)}${'Release'.padEnd(48)}I`;

  const rows = day.events.map((e) =>
    `${pad(e.time, 8)}${pad(e.release, 46)}${IMPACT[e.impact] ?? '-'}`
  );

  return [header, sep, colHeader, sep, ...rows].join('\n');
}

export function getCalendarBlock(dayArg?: string, isNext = false): { title: string; block: string } | { error: string } {
  let targetDay: string;
  if (dayArg && DAY_ARGS[dayArg.toLowerCase()]) {
    targetDay = DAY_ARGS[dayArg.toLowerCase()];
  } else {
    targetDay = TODAY_MAP[new Date().getDay()];
  }

  if (targetDay === 'Sat' || targetDay === 'Sun') {
    const events = buildWeekendEvents();
    return {
      title: `Economic Calendar — ${targetDay} (Markets Closed)`,
      block: '```\n' + formatDay({ day: targetDay, date: 'Market Closed', events }) + '\n```',
    };
  }

  if (!fs.existsSync(CALENDAR_PATH)) {
    return { error: 'Calendar not yet scraped. Run `scrapeCalendar.py` first.' };
  }

  const data = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf-8'));

  const weekKey = isNext ? 'next_week' : 'current_week';
  const week: any[] | undefined = data[weekKey] ?? data['days'];

  if (!week) {
    return { error: isNext ? 'Next week\'s calendar is not available yet.' : 'Calendar data is missing.' };
  }

  const day = week.find((d: any) => d.day === targetDay);
  if (!day) {
    return { error: `No data for ${targetDay}${isNext ? ' next week' : ''}. The calendar may not include that day.` };
  }

  const weekLabel = isNext ? ' (Next Week)' : '';
  return {
    title: `Economic Calendar — ${day.day} ${day.date}${weekLabel}`,
    block: '```\n' + formatDay(day) + '\n```',
  };
}
