import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(__dirname, '../commands/TickerTracker/ticker_history.json');
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

interface TickerRecord {
  ticker: string;
  userId: string;
  username: string;
  ts: number;
}

interface TickerCount {
  _id: string;
  count: number;
}

function loadRecords(): TickerRecord[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) as TickerRecord[];
  } catch {
    return [];
  }
}

function saveRecords(records: TickerRecord[]): void {
  const cutoff = Date.now() - NINETY_DAYS_MS;
  const trimmed = records.filter((r) => r.ts >= cutoff);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

function topCounts(records: TickerRecord[], limit: number): TickerCount[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.ticker, (counts.get(r.ticker) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([_id, count]) => ({ _id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export class TickerTracker {
  private static LastMessage = new Map<string, { callerMessageId: string; imageMessageId: string }>();

  static readonly DateChars = new Set(['d', 'w', 'm']);

  static lastTicker(userId: string, callerMessageId: string, imageMessageId: string): void {
    TickerTracker.LastMessage.set(userId, { callerMessageId, imageMessageId });
  }

  static getCallerMessage(userId: string): string {
    return TickerTracker.LastMessage.get(userId)?.callerMessageId;
  }

  static getImageMessage(userId: string): string {
    return TickerTracker.LastMessage.get(userId)?.imageMessageId;
  }

  static postTicker(ticker: string, userId: string, username: string): void {
    const records = loadRecords();
    records.push({ ticker: ticker.toLowerCase(), userId, username, ts: Date.now() });
    saveRecords(records);
  }

  static getTickers(limit: number): TickerCount[] {
    return topCounts(loadRecords(), limit);
  }

  static getTickersByUser(limit: number, query: string): TickerCount[] {
    const q = query.toLowerCase();
    return topCounts(loadRecords().filter((r) => r.userId === query || r.username.toLowerCase() === q), limit);
  }

  static getTickersByTime(limit: number, period: string): TickerCount[] {
    const periodMs: Record<string, number> = {
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      m: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = Date.now() - (periodMs[period] ?? periodMs['d']);
    return topCounts(loadRecords().filter((r) => r.ts >= cutoff), limit);
  }
}
