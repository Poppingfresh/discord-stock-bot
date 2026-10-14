import got from 'got';
import * as cheerio from 'cheerio';

interface FinVizTable {
    release: string;
    actual: string;
    date: string;
    expected: string;
    for: string;
    impact: number;
    prior: string;
    time: string;
}

// Finviz moved the events table off the homepage. The economic calendar page embeds the
// whole week as JSON in <script id="route-init-data"> (same source scripts/scrapeCalendar.py uses).
const CALENDAR_URL = 'https://finviz.com/calendar/economic';

const display = (v: unknown): string => (v === null || v === undefined || v === '' ? '-' : String(v));

// "2026-10-13T08:30:00" -> "8:30AM". Parsed from the string so the server timezone can't shift it.
const formatTime = (iso: string): string => {
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return '-';
  const hour = parseInt(m[1], 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m[2]}${suffix}`;
};

const localDateKey = (d: Date): string => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const getFinvizEventsTable = async (
): Promise<FinVizTable[]> => {
  // Finviz rejects got's default User-Agent; same header the screener uses.
  const result = await got(CALENDAR_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; discord-stock-bot/1.0)' },
  });
  const $ = cheerio.load(result.body);
  const raw = $('script#route-init-data').html();
  if (!raw) {
    throw new Error(`!events: route-init-data script tag not found at ${CALENDAR_URL}`);
  }

  const entries: any[] = JSON.parse(raw)?.data?.entries ?? [];
  const today = localDateKey(new Date());

  return entries
    .filter((entry) => typeof entry.date === 'string' && entry.date.startsWith(today))
    .map((entry) => ({
      release: display(entry.event),
      actual: display(entry.actual),
      date: entry.date.substring(5, 10),
      expected: display(entry.forecast),
      for: display(entry.reference),
      impact: Number(entry.importance) || 0,
      prior: display(entry.previous),
      time: formatTime(entry.date),
    }));
};
