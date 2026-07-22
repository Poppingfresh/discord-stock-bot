import got from 'got';

interface NextEarningsResponse {
  found: boolean;
  ticker: string;
  date?: string;
  date_end?: string | null;
  estimated?: boolean;
  eps_estimate?: number | null;
  error?: string;
}

// Looks up the next scheduled earnings date for a ticker via the
// market-dashboard /next_earnings/<ticker> endpoint (yfinance-backed).
export async function getNextEarnings(
  rawTicker: string,
): Promise<{ title: string; description: string } | { error: string }> {
  const ticker = rawTicker.trim().toUpperCase();

  let res: NextEarningsResponse;
  try {
    res = await got(
      `${process.env.MARKET_DASHBOARD_URI}/next_earnings/${encodeURIComponent(ticker)}`,
    ).json<NextEarningsResponse>();
  } catch (e) {
    console.error(e);
    return { error: `Could not look up earnings for ${ticker}.` };
  }

  if (!res.found) {
    return { error: res.error ?? `No upcoming earnings date found for ${ticker}.` };
  }

  const lines: string[] = [];
  if (res.estimated && res.date_end && res.date_end !== res.date) {
    lines.push(`Estimated between **${res.date}** and **${res.date_end}**`);
  } else {
    lines.push(`**${res.date}**`);
  }
  if (res.eps_estimate !== null && res.eps_estimate !== undefined) {
    lines.push(`EPS estimate: ${res.eps_estimate}`);
  }

  return {
    title: `Next Earnings — ${ticker}`,
    description: lines.join('\n'),
  };
}
