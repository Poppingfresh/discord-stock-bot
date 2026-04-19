import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.TICKER_DB_PATH ?? path.join(__dirname, '../commands/TickerTracker/ticker_history.db');
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS ticker_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    ts INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ts ON ticker_history(ts);
  CREATE INDEX IF NOT EXISTS idx_ticker ON ticker_history(ticker);
  CREATE INDEX IF NOT EXISTS idx_userId ON ticker_history(userId);
`);

interface TickerCount {
  _id: string;
  count: number;
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
    const cutoff = Date.now() - NINETY_DAYS_MS;
    db.prepare('DELETE FROM ticker_history WHERE ts < ?').run(cutoff);
    db.prepare('INSERT INTO ticker_history (ticker, userId, username, ts) VALUES (?, ?, ?, ?)').run(
      ticker.toLowerCase(), userId, username, Date.now()
    );
  }

  static getTickers(limit: number): TickerCount[] {
    return db
      .prepare('SELECT ticker AS _id, COUNT(*) AS count FROM ticker_history GROUP BY ticker ORDER BY count DESC LIMIT ?')
      .all(limit) as TickerCount[];
  }

  static getTickersByUser(limit: number, query: string): TickerCount[] {
    const q = query.toLowerCase();
    return db
      .prepare(
        'SELECT ticker AS _id, COUNT(*) AS count FROM ticker_history WHERE userId = ? OR LOWER(username) = ? GROUP BY ticker ORDER BY count DESC LIMIT ?'
      )
      .all(query, q, limit) as TickerCount[];
  }

  static getTickersByTime(limit: number, period: string): TickerCount[] {
    const periodMs: Record<string, number> = {
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      m: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = Date.now() - (periodMs[period] ?? periodMs['d']);
    return db
      .prepare(
        'SELECT ticker AS _id, COUNT(*) AS count FROM ticker_history WHERE ts >= ? GROUP BY ticker ORDER BY count DESC LIMIT ?'
      )
      .all(cutoff, limit) as TickerCount[];
  }
}
