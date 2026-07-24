import type { PricePoint, StockQuote, TimeRange } from '../types';
import { STOCK_DATABASE } from '../data/mockStocks';
import { lookupAliases } from '../config/tickerAliases';

type CacheEntry<T> = { data: T; ts: number };

export interface MarketDataMeta {
  source: 'Yahoo Finance';
  lastUpdated: string;
  delayed: boolean;
  error?: string;
}

export interface MarketQuote extends StockQuote {
  source: 'Yahoo Finance';
  lastUpdated: string;
  isFallback: false;
}

export interface MarketSummaryItem {
  symbol: string;
  label: string;
  price: number | null;
  changePercent: number | null;
  source: 'Yahoo Finance';
  lastUpdated: string | null;
  error?: string;
}

const QUOTE_TTL = 45_000;
const HISTORY_TTL = 10 * 60_000;
const FUNDAMENTALS_TTL = 12 * 60 * 60_000;

const quoteCache = new Map<string, CacheEntry<MarketQuote>>();
const historyCache = new Map<string, CacheEntry<PricePoint[]>>();
const fundamentalsCache = new Map<string, CacheEntry<Partial<StockQuote>>>();

const RANGE_MAP: Record<TimeRange, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '60m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '3Y': { range: '3y', interval: '1wk' },
  '5Y': { range: '5y', interval: '1wk' },
};

const MARKET_SUMMARY: Array<{ symbol: string; label: string }> = [
  { symbol: 'SPY', label: 'SPY' },
  { symbol: 'QQQ', label: 'QQQ' },
  { symbol: 'BTC-USD', label: 'BTC' },
  { symbol: '^VIX', label: 'VIX' },
  { symbol: '^TNX', label: '10Y' },
  { symbol: 'DX-Y.NYB', label: 'DXY' },
];

function nowIso() {
  return new Date().toISOString();
}

function isFresh<T>(entry: CacheEntry<T> | undefined, ttl: number) {
  return Boolean(entry && Date.now() - entry.ts < ttl);
}

function yahooSymbol(ticker: string) {
  const normalized = ticker.trim().toUpperCase();
  if (normalized === 'BRK.B') return 'BRK-B';
  if (normalized === 'BTC') return 'BTC-USD';
  if (normalized === 'VIX') return '^VIX';
  if (normalized === '10Y') return '^TNX';
  if (normalized === 'DXY') return 'DX-Y.NYB';
  return normalized;
}

export function normalizeSymbol(ticker: string) {
  return ticker.trim().toUpperCase().replace('BRK.B', 'BRK-B');
}

function displaySymbol(ticker: string) {
  return ticker.replace('^', '').replace('-USD', '').replace('DX-Y.NYB', 'DXY').replace('TNX', '10Y');
}

async function fetchJson(url: string, timeout = 5_000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Yahoo Finance returned ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function mapYahooQuote(raw: any, requestedTicker: string): MarketQuote | null {
  if (!raw || typeof raw.regularMarketPrice !== 'number') return null;
  const symbol = requestedTicker.toUpperCase();
  const metadata = STOCK_DATABASE[symbol] ?? STOCK_DATABASE[raw.symbol] ?? {};
  const price = Number(raw.regularMarketPrice);
  const previousClose = Number(raw.regularMarketPreviousClose ?? raw.previousClose ?? price);
  const change = Number(raw.regularMarketChange ?? price - previousClose);
  const changePercent = Number(raw.regularMarketChangePercent ?? (previousClose ? (change / previousClose) * 100 : 0));

  return {
    symbol,
    name: raw.longName || raw.shortName || metadata.name || symbol,
    price,
    change,
    changePercent,
    volume: Number(raw.regularMarketVolume ?? 0),
    marketCap: Number(raw.marketCap ?? 0),
    peRatio: Number(raw.trailingPE ?? raw.forwardPE ?? 0),
    high52w: Number(raw.fiftyTwoWeekHigh ?? 0),
    low52w: Number(raw.fiftyTwoWeekLow ?? 0),
    avgVolume: Number(raw.averageDailyVolume3Month ?? raw.averageVolume ?? 0),
    beta: Number(raw.beta ?? metadata.beta ?? 1),
    sector: raw.sector || metadata.sector || 'Unknown',
    industry: raw.industry || metadata.industry || '',
    previousClose,
    open: Number(raw.regularMarketOpen ?? 0),
    dayHigh: Number(raw.regularMarketDayHigh ?? 0),
    dayLow: Number(raw.regularMarketDayLow ?? 0),
    eps: Number(raw.epsTrailingTwelveMonths ?? 0),
    dividendYield: Number(raw.dividendYield ? raw.dividendYield * 100 : 0),
    source: 'Yahoo Finance',
    lastUpdated: nowIso(),
    isFallback: false,
  };
}

function mapYahooChartResult(result: any, requestedTicker: string): MarketQuote | null {
  const meta = result?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') return null;
  const symbol = requestedTicker.toUpperCase();
  const metadata = STOCK_DATABASE[symbol] ?? STOCK_DATABASE[meta.symbol] ?? {};
  const quote = result?.indicators?.quote?.[0];
  const firstOpen = Array.isArray(quote?.open) ? quote.open.find((value: number | null) => typeof value === 'number' && value > 0) : undefined;
  const price = Number(meta.regularMarketPrice);
  const previousClose = Number(meta.previousClose ?? meta.chartPreviousClose ?? price);
  const change = price - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    name: meta.longName || meta.shortName || metadata.name || symbol,
    price,
    change,
    changePercent,
    volume: Number(meta.regularMarketVolume ?? 0),
    marketCap: 0,
    peRatio: 0,
    high52w: Number(meta.fiftyTwoWeekHigh ?? 0),
    low52w: Number(meta.fiftyTwoWeekLow ?? 0),
    avgVolume: 0,
    beta: Number(metadata.beta ?? 1),
    sector: metadata.sector || 'Unknown',
    industry: metadata.industry || '',
    previousClose,
    open: Number(firstOpen ?? 0),
    dayHigh: Number(meta.regularMarketDayHigh ?? 0),
    dayLow: Number(meta.regularMarketDayLow ?? 0),
    eps: 0,
    dividendYield: 0,
    source: 'Yahoo Finance',
    lastUpdated: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : nowIso(),
    isFallback: false,
  };
}

async function getQuoteFromChart(symbol: string): Promise<MarketQuote | null> {
  const json = await fetchJson(`/api/yahoo/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?range=1d&interval=1m`, 7_000);
  const result = json?.chart?.result?.[0];
  return mapYahooChartResult(result, symbol);
}

export async function getQuote(ticker: string, options: { forceRefresh?: boolean } = {}): Promise<MarketQuote | null> {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return null;
  const cached = quoteCache.get(symbol);
  if (!options.forceRefresh && isFresh(cached, QUOTE_TTL)) return cached!.data;

  // Primary path: the v8 chart endpoint. It needs no auth crumb, unlike
  // v7/finance/quote which Yahoo now answers with 401 for anonymous callers.
  try {
    const quote = await getQuoteFromChart(symbol);
    if (!quote) throw new Error(`No chart quote returned for ${symbol}`);
    quoteCache.set(symbol, { data: quote, ts: Date.now() });
    return quote;
  } catch (chartError) {
    // Secondary path: v7 quote. Only succeeds when the proxy managed to attach
    // a valid crumb, but it carries richer fields (marketCap, P/E, EPS) when it does.
    try {
      const yahoo = yahooSymbol(symbol);
      const json = await fetchJson(`/api/yahoo/v7/finance/quote?symbols=${encodeURIComponent(yahoo)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,trailingPE,forwardPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,averageDailyVolume3Month,averageVolume,beta,shortName,longName,sector,industry,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,epsTrailingTwelveMonths,dividendYield`);
      const raw = json?.quoteResponse?.result?.[0];
      const quote = mapYahooQuote(raw, symbol);
      if (!quote) throw new Error(`No quote returned for ${symbol}`);
      quoteCache.set(symbol, { data: quote, ts: Date.now() });
      return quote;
    } catch (quoteError) {
      console.warn(`Market data unavailable for ${symbol}:`, chartError, quoteError);
      return null;
    }
  }
}

export async function getQuotes(tickers: string[], options: { forceRefresh?: boolean } = {}): Promise<Record<string, MarketQuote | null>> {
  const unique = Array.from(new Set(tickers.map(t => t.trim().toUpperCase()).filter(Boolean)));
  const results: Record<string, MarketQuote | null> = {};
  const missing = unique.filter(symbol => options.forceRefresh || !isFresh(quoteCache.get(symbol), QUOTE_TTL));

  for (const symbol of unique) {
    if (!options.forceRefresh && isFresh(quoteCache.get(symbol), QUOTE_TTL)) {
      results[symbol] = quoteCache.get(symbol)!.data;
    }
  }

  if (missing.length) {
    // The v7 batch endpoint is gated behind an auth crumb, so fan out over the
    // keyless chart endpoint instead. One request per symbol, all in parallel.
    const settled = await Promise.allSettled(missing.map(symbol => getQuoteFromChart(symbol)));
    settled.forEach((outcome, index) => {
      const symbol = missing[index];
      const quote = outcome.status === 'fulfilled' ? outcome.value : null;
      results[symbol] = quote;
      if (quote) quoteCache.set(symbol, { data: quote, ts: Date.now() });
      else if (outcome.status === 'rejected') {
        console.warn(`Market data unavailable for ${symbol}:`, outcome.reason);
      }
    });
  }

  return results;
}

export async function getHistoricalPrices(ticker: string, range: TimeRange = '1Y', options: { forceRefresh?: boolean } = {}): Promise<PricePoint[]> {
  const symbol = ticker.trim().toUpperCase();
  const key = `${symbol}:${range}`;
  const cached = historyCache.get(key);
  if (!options.forceRefresh && isFresh(cached, HISTORY_TTL)) return cached!.data;

  try {
    const config = RANGE_MAP[range];
    const json = await fetchJson(`/api/yahoo/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?range=${config.range}&interval=${config.interval}`, 7_000);
    const result = json?.chart?.result?.[0];
    const timestamps: number[] | undefined = result?.timestamp;
    const quote = result?.indicators?.quote?.[0];
    if (!timestamps || !quote) throw new Error(`No chart data returned for ${symbol}`);
    const data = timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: Number(quote.close?.[index] ?? 0),
      open: Number(quote.open?.[index] ?? 0),
      high: Number(quote.high?.[index] ?? 0),
      low: Number(quote.low?.[index] ?? 0),
      volume: Number(quote.volume?.[index] ?? 0),
    })).filter(point => point.close > 0);
    if (data.length === 0) throw new Error(`No usable chart data returned for ${symbol}`);
    historyCache.set(key, { data, ts: Date.now() });
    return data;
  } catch (error) {
    console.warn(`Historical data unavailable for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fields the chart endpoint cannot supply (market cap, P/E, EPS, ...). They live
 * behind Yahoo's crumb-gated quote API, so the backend fetches them via yfinance,
 * which performs that handshake server-side. Returns {} when the backend is down —
 * the caller keeps the chart-derived quote rather than failing outright.
 */
async function getBackendFundamentals(symbol: string): Promise<Partial<MarketQuote>> {
  try {
    const raw = await fetchJson(`/api/portfolio/fundamentals/${encodeURIComponent(symbol)}`, 8_000);
    const picked: Partial<MarketQuote> = {};
    if (Number(raw?.marketCap) > 0) picked.marketCap = Number(raw.marketCap);
    if (Number(raw?.peRatio) > 0) picked.peRatio = Number(raw.peRatio);
    if (Number(raw?.eps)) picked.eps = Number(raw.eps);
    if (Number(raw?.beta) > 0) picked.beta = Number(raw.beta);
    if (Number(raw?.avgVolume) > 0) picked.avgVolume = Number(raw.avgVolume);
    if (Number(raw?.dividendYield) > 0) picked.dividendYield = Number(raw.dividendYield);
    if (raw?.sector && raw.sector !== 'N/A') picked.sector = String(raw.sector);
    if (raw?.industry) picked.industry = String(raw.industry);
    return picked;
  } catch {
    return {};
  }
}

export async function getFundamentals(ticker: string): Promise<Partial<StockQuote> | null> {
  const symbol = ticker.trim().toUpperCase();
  const cached = fundamentalsCache.get(symbol);
  if (isFresh(cached, FUNDAMENTALS_TTL)) return cached!.data;
  const quote = await getQuote(symbol);
  if (!quote) return null;
  const enriched = { ...quote, ...await getBackendFundamentals(symbol) };
  fundamentalsCache.set(symbol, { data: enriched, ts: Date.now() });
  return enriched;
}

export async function getMarketSummary(options: { forceRefresh?: boolean } = {}): Promise<MarketSummaryItem[]> {
  const quotes = await getQuotes(MARKET_SUMMARY.map(item => item.symbol), options);
  return MARKET_SUMMARY.map(item => {
    const quote = quotes[item.symbol];
    return {
      symbol: displaySymbol(item.label),
      label: item.label,
      price: quote?.price ?? null,
      changePercent: quote?.changePercent ?? null,
      source: 'Yahoo Finance',
      lastUpdated: quote?.lastUpdated ?? null,
      error: quote ? undefined : 'Market data unavailable',
    };
  });
}

export async function getSparkline(ticker: string, range: TimeRange = '1M'): Promise<number[]> {
  const history = await getHistoricalPrices(ticker, range);
  return history.map(point => point.close);
}

export async function getBenchmarkData(symbol: string = 'SPY', range: TimeRange = '1Y'): Promise<PricePoint[]> {
  return getHistoricalPrices(symbol, range);
}

export function getMarketDataMeta(quote?: MarketQuote | null): MarketDataMeta {
  return {
    source: 'Yahoo Finance',
    lastUpdated: quote?.lastUpdated ?? nowIso(),
    delayed: true,
    error: quote ? undefined : 'Market data unavailable',
  };
}

export function getDataFreshness(quote?: MarketQuote | null) {
  const lastUpdated = quote?.lastUpdated ?? null;
  return {
    source: 'Yahoo Finance' as const,
    status: quote ? 'delayed' as const : 'unavailable' as const,
    lastUpdated,
    label: quote && lastUpdated
      ? `Yahoo Finance · Updated ${new Date(lastUpdated).toLocaleTimeString()}`
      : 'Yahoo Finance · Market data unavailable',
  };
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  sector: string;
  exchange?: string;
}

/** Instant local search over the bundled STOCK_DATABASE (no network). */
export function searchMarketSymbols(query: string): SymbolSearchResult[] {
  const q = query.trim().toLowerCase();
  return Object.values(STOCK_DATABASE)
    .filter(stock => !q || stock.symbol?.toLowerCase().includes(q) || stock.name?.toLowerCase().includes(q) || stock.sector?.toLowerCase().includes(q))
    .map(stock => ({
      symbol: stock.symbol!,
      name: stock.name!,
      sector: stock.sector ?? 'Unknown',
    }))
    .slice(0, 12);
}

// Yahoo exchange codes grouped by the market suffix they map to. Used to keep a
// live search result inside the market the user is actually browsing.
const EXCHANGE_BY_SUFFIX: Record<string, string[]> = {
  '.SA': ['SAO'],
  '.L': ['LSE'],
  '.DE': ['GER', 'FRA', 'STU', 'MUN', 'DUS', 'HAM', 'BER', 'XETRA'],
  '.PA': ['PAR'],
  '.T': ['JPX', 'TSE'],
  '.HK': ['HKG'],
};

const searchCache = new Map<string, { data: SymbolSearchResult[]; ts: number }>();
const SEARCH_TTL = 5 * 60_000;

/**
 * Live symbol search across every exchange Yahoo indexes — not just the bundled
 * database — so names like Vivo (VIVT3.SA) or Oi (OIBR3.SA) resolve.
 * - `suffix === undefined` → GLOBAL: every exchange, no market filter.
 * - `suffix === ''`        → US-listed only (no dotted suffix).
 * - `suffix === '.XX'`     → that market only.
 * Falls back to the local database on any failure.
 */
export async function searchYahooSymbols(query: string, suffix?: string): Promise<SymbolSearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const cacheKey = `${suffix ?? '*'}:${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (isFresh(cached, SEARCH_TTL)) return cached!.data;

  // Brand aliases first — these fix cases Yahoo's name index misses (Vivo, Oi, ...).
  const aliasHits: SymbolSearchResult[] = lookupAliases(q, suffix).map(a => ({
    symbol: a.ticker, name: a.name, sector: a.sector,
  }));

  try {
    const json = await fetchJson(`/api/yahoo/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=20&newsCount=0`, 6_000);
    const quotes: any[] = json?.quotes ?? [];
    const allowedExchanges = suffix ? EXCHANGE_BY_SUFFIX[suffix] : undefined;

    const live = quotes
      .filter(item => {
        const symbol: string = item?.symbol ?? '';
        if (!symbol) return false;
        const type = String(item?.quoteType ?? '').toUpperCase();
        if (type !== 'EQUITY' && type !== 'ETF') return false;
        if (suffix === undefined) {
          // Global search: accept every equity/ETF Yahoo returns.
          return true;
        }
        if (suffix === '') {
          // US market: no dotted suffix (AAPL, not AAPL.SA).
          return !symbol.includes('.');
        }
        // Prefer the exact suffix, but also accept the exchange code as a guard
        // for the rare symbol Yahoo returns without one.
        return symbol.toUpperCase().endsWith(suffix.toUpperCase())
          || (allowedExchanges?.includes(String(item?.exchange ?? '')) ?? false);
      })
      .map(item => ({
        symbol: String(item.symbol),
        name: String(item.shortname || item.longname || item.symbol),
        sector: String(item.sector || item.industry || 'Equity'),
        exchange: String(item.exchDisp || item.exchange || ''),
      }));

    // Aliases first, then live results, de-duplicated by symbol.
    const seen = new Set<string>();
    const results: SymbolSearchResult[] = [];
    for (const r of [...aliasHits, ...live]) {
      const key = r.symbol.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(r);
    }
    const trimmed = results.slice(0, 12);
    searchCache.set(cacheKey, { data: trimmed, ts: Date.now() });
    return trimmed;
  } catch {
    // Network/proxy failure — fall back to aliases + the bundled database.
    const local = searchMarketSymbols(q).filter(r =>
      suffix === undefined ? true
      : suffix === '' ? !r.symbol.includes('.')
      : r.symbol.toUpperCase().endsWith(suffix.toUpperCase())
    );
    const seen = new Set<string>();
    return [...aliasHits, ...local].filter(r => {
      const key = r.symbol.toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const DATA_SOURCE_LABEL = 'Data source: Yahoo Finance';
