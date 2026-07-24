import type { PricePoint, StockQuote, TimeRange } from '../types';
import {
  getFundamentals,
  getHistoricalPrices,
  getQuote,
  getQuotes,
  searchMarketSymbols,
} from '../services/marketDataService';

/**
 * Get a single stock quote, enriched with the fundamentals (market cap, P/E, EPS)
 * that the price feed alone cannot provide. Used by detail views; list views should
 * call getMultipleQuotes, which stays on the faster price-only path.
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const enriched = await getFundamentals(symbol);
  if (enriched) return enriched as StockQuote;
  return getQuote(symbol);
}

/** Get price history from the unified Yahoo Finance market data layer. */
export async function getStockHistory(symbol: string, timeRange: TimeRange, _currentPrice?: number): Promise<PricePoint[]> {
  return getHistoricalPrices(symbol, timeRange);
}

/** Get multiple quotes from the same Yahoo Finance cache/source. */
export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, StockQuote | null>> {
  return getQuotes(symbols);
}

/**
 * Legacy compatibility helper.
 * Live prices should not be simulated anymore; return the current value unchanged.
 */
export function simulateLivePrice(currentPrice: number): number {
  return currentPrice;
}

/** Search static ticker metadata only; prices still come from Yahoo Finance. */
export function searchStocks(query: string): Array<{ symbol: string; name: string; sector: string }> {
  return searchMarketSymbols(query);
}
