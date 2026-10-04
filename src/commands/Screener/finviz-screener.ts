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
  if (!finvizScreenerUrl.startsWith('https://finviz.com/screener.ashx?v=')) {
    throw Error('Screener must be a finviz screener. https://finviz.com/screener.ashx?v=');
  }
  
  const result = await got(finvizScreenerUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; discord-stock-bot/1.0)',
    }
  });
  const $ = cheerio.load(result.body);
  const scrapedData: { [key: string]: string }[] = [];
  const tableHeaders: string[] = [];

  // Extract headers dynamically and normalize them.
  // '%' is stripped because Finviz renamed "Change" to "Change %"; keeps the key 'change'.
  $('table.screener_table thead th').each((_i, thElement) => {
    const header = $(thElement).text().trim().toLowerCase().replace(/[\s%]+/g, '');
    tableHeaders.push(header);
  });

  // Extract data rows
  $('table.screener_table tbody tr').each((_index, trElement) => {
    const tds = $(trElement).find('td');
    const tableRow: { [key: string]: string } = {};
    $(tds).each((i, tdElement) => {
      const key = tableHeaders[i];
      const $td = $(tdElement);
      // Finviz added a company logo to the ticker cell: an <a class="company-ticker">
      // wrapping an <img> plus a first-letter fallback <span> (e.g. <span>S</span>).
      // Its text is concatenated ahead of the real ticker anchor by .text(), which
      // duplicates the first letter (STAK -> "S" + "STAK" = "SSTAK"). Strip it out.
      $td.find('a.company-ticker').remove();
      const value = $td.text().trim();
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
