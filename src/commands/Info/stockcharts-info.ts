import got from 'got';
import * as cheerio from 'cheerio';

export interface Earnings {
  NextEarningDate: string;
  earningsTime: string;
  LastEarningDate: string;
}

export interface Fundamentals {
  date: string;
  DividendExDate: string;
  EPS: string;
  Website: string;
  RevenuePerShare: string;
  NumberOfEmployees: string;
  SalesOrRevenue: string;
  DividendRate: string;
  MarketCapitalizationIssuerLevel: string;
  Address2: string;
  PriceToFreeCashFlow: string;
  SharesHeldByInstitutions: string;
  Address1: string;
  City: string;
  PriceToCashFlow: string;
  BusinessDescription: string;
  Float: string;
  BookValue: string;
  earnings: Earnings;
  PERatio: string;
  State: string;
  PriceToBook: string;
  Beta60Month: string;
  SharesOutstanding: string;
  FloatAsPercentOfSharesOutstanding: string;
  PEGRatio: string;
}

export interface SctrhistEntity {
  date: string;
  value: number;
}
export interface TickerInfo {
  fundamentals: Fundamentals;
  symbol: string;
  latestTrade: string;
  country: number;
  smavol: number;
  yearrange: string;
  EPS: number;
  rsi: string;
  industry: string;
  sectorSCTR: number;
  high: string;
  allTimeHigh: string;
  low: string;
  yield: string;
  options: number;
  dividend: string;
  sector: string;
  close: string;
  perf: string;
  atr: string;
  industryName: string;
  marketCap: number;
  sma200: string;
  sma50: string;
  lastSCTR: number;
  SCTR: number;
  sctrhist?: (SctrhistEntity)[] | null;
  outstandingShares: number;
  volume: string;
  lastClose: string;
  adx: string;
  PE: number;
  ema20: string;
  universe: string;
  name: string;
  exchange: number;
  open: string;
}

export const getSymbolInfo = async (ticker: string): Promise<TickerInfo> => got(`https://stockcharts.com/j-sum/sum?cmd=symsum&symbol=${encodeURIComponent(ticker)}`).json();

// Finviz rejects got's default User-Agent; same header the screener uses.
const getQuotePage = async (ticker: string): Promise<cheerio.CheerioAPI> => {
  const result = await got(`https://finviz.com/quote.ashx?t=${encodeURIComponent(ticker)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; discord-stock-bot/1.0)' },
  });
  return cheerio.load(result.body);
};

export const getCompanyInfo = async (ticker: string): Promise<string> => {
  const $ = await getQuotePage(ticker);
  const bio = $('[class*="profile-bio"], [class*="profile_bio"]').first().text().trim();
  if (bio) return bio;
  // Layout changed and the bio class is gone: the profile paragraph is the
  // longest block of plain text on the quote page.
  let longest = '';
  $('div, p, td').each((_, el) => {
    if ($(el).children().length > 0) return;
    const text = $(el).text().trim();
    if (text.length > longest.length) longest = text;
  });
  return longest.length > 150 ? longest : '';
};

// Matches "Today 02:00AM", "Oct-02-26 10:01PM" and bare "06:01PM".
// A bare time belongs to the same day as the row above it.
const NEWS_TIME = /(Today|[A-Z][a-z]{2}-\d{2}-\d{2})?\s*\d{1,2}:\d{2}\s?[AP]M/;

export const getCompanyNews = async (ticker: string): Promise<string[]> => {
  const $ = await getQuotePage(ticker);
  let links = $('a.tab-link-news');
  if (links.length === 0) links = $('#news-table a, [id*="news"] a[href^="http"]');

  const news: string[] = [];
  links.each((_, a) => {
    if (news.length >= 5) return false;
    const headline = $(a).text().trim();
    if (!headline) return;
    // Climb to the row holding both the timestamp and the link.
    let row = $(a).parent();
    for (let i = 0; i < 5 && row.length && !NEWS_TIME.test(row.text()); i++) row = row.parent();
    const time = row.text().match(NEWS_TIME)?.[0].trim() ?? '';
    const line = `${time}  ${headline}`;
    if (!news.includes(line)) news.push(line);
  });
  return news;
};
