import got from 'got';
import * as cheerio from 'cheerio';

// Common normalized field names that appear across different screener types
interface FinvizScreenerData {
  no?: string;
  ticker?: string;
  company?: string;
  sector?: string;
  industry?: string;
  country?: string;
  marketcap?: string;
  pe?: string;
  price?: string;
  change?: string;
  volume?: string;
  avgvolume?: string;
  relvolume?: string;
  perfweek?: string;
  perfmonth?: string;
  perfquart?: string;
  perfhalf?: string;
  perfytd?: string;
  perfyear?: string;
  volatilityw?: string;
  volatilitym?: string;
}

export const getFinvizScreenWholeTable = async (
  finvizScreenerUrl: string,
): Promise<{ [key: string]: string }[]> => {
  // Finviz moved the screener from screener.ashx to screener/stocks (the old URL redirects).
  if (!finvizScreenerUrl.startsWith('https://finviz.com/screener.ashx?v=')
    && !finvizScreenerUrl.startsWith('https://finviz.com/screener/stocks?')) {
    throw Error('Screener must be a finviz screener. https://finviz.com/screener/stocks?v=');
  }

  const result = await got(finvizScreenerUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; discord-stock-bot/1.0)',
    }
  });
  const $ = cheerio.load(result.body);
  const scrapedData: { [key: string]: string }[] = [];

  // The results are no longer a <table>: they are role="grid" divs. Header and body
  // cells share a data-column-id, so map each column id to its normalized full label.
  // Only the full label is read: headers also carry a short label (Change % / Chg %).
  // '%' is stripped because Finviz renamed "Change" to "Change %"; keeps the key 'change'.
  const columnKeys: { [columnId: string]: string } = {};
  $('.fv-table_header-cell').each((_i, headerElement) => {
    const columnId = $(headerElement).attr('data-column-id');
    const label = $(headerElement).find('.fv-table_header-label').first().text();
    if (columnId) {
      columnKeys[columnId] = label.trim().toLowerCase().replace(/[\s%]+/g, '');
    }
  });

  // Extract data rows
  $('.fv-table_row[data-row-key]').each((_index, rowElement) => {
    const tableRow: { [key: string]: string } = {};
    $(rowElement).find('.fv-table_cell').each((_i, cellElement) => {
      const $cell = $(cellElement);
      const columnId = $cell.attr('data-column-id');
      const key = columnId ? (columnKeys[columnId] || columnId) : undefined;
      // The ticker cell includes a logo with a first-letter fallback <span>, so .text()
      // would double the first letter (SPOT -> "SSPOT"). Read data-ticker instead.
      const value = ($cell.attr('data-ticker') ?? $cell.text()).trim();
      if (key) {
        tableRow[key] = value;
      }
    });
    if (Object.keys(tableRow).length > 0) {
      scrapedData.push(tableRow);
    }
  });

  return scrapedData;
};
