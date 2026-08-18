import type { StockQuote } from '../types';

// Static company metadata only. Current prices, market cap, volume, and charts
// must come from services/marketDataService.ts (Yahoo Finance).
export const STOCK_DATABASE: Record<string, Partial<StockQuote>> = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', beta: 1.19, sector: 'Technology', industry: 'Consumer Electronics' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', beta: 0.9, sector: 'Technology', industry: 'Software' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', beta: 1.04, sector: 'Communication Services', industry: 'Internet Services' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', beta: 1.15, sector: 'Consumer Discretionary', industry: 'E-Commerce & Cloud' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', beta: 2.34, sector: 'Consumer Discretionary', industry: 'Electric Vehicles' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', beta: 1.68, sector: 'Technology', industry: 'Semiconductors' },
  META: { symbol: 'META', name: 'Meta Platforms', beta: 1.27, sector: 'Communication Services', industry: 'Social Media' },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc.', beta: 1.45, sector: 'Communication Services', industry: 'Streaming' },
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase', beta: 1.12, sector: 'Financials', industry: 'Banking' },
  GS: { symbol: 'GS', name: 'Goldman Sachs', beta: 1.35, sector: 'Financials', industry: 'Investment Banking' },
  XOM: { symbol: 'XOM', name: 'Exxon Mobil Corp.', beta: 0.88, sector: 'Energy', industry: 'Oil & Gas' },
  JNJ: { symbol: 'JNJ', name: 'Johnson & Johnson', beta: 0.58, sector: 'Healthcare', industry: 'Pharmaceuticals' },
  KO: { symbol: 'KO', name: 'Coca-Cola Co.', beta: 0.58, sector: 'Consumer Staples', industry: 'Beverages' },
  BRK: { symbol: 'BRK.B', name: 'Berkshire Hathaway B', beta: 0.88, sector: 'Financials', industry: 'Diversified Holdings' },
  'BRK.B': { symbol: 'BRK.B', name: 'Berkshire Hathaway B', beta: 0.88, sector: 'Financials', industry: 'Diversified Holdings' },
  SPY: { symbol: 'SPY', name: 'S&P 500 ETF Trust', beta: 1, sector: 'ETF', industry: 'Index Fund' },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', beta: 1.72, sector: 'Technology', industry: 'Semiconductors' },
  INTC: { symbol: 'INTC', name: 'Intel Corporation', beta: 1.04, sector: 'Technology', industry: 'Semiconductors' },
  V: { symbol: 'V', name: 'Visa Inc.', beta: 0.94, sector: 'Financials', industry: 'Payment Processing' },
  DIS: { symbol: 'DIS', name: 'Walt Disney Co.', beta: 1.3, sector: 'Communication Services', industry: 'Entertainment' },
  PYPL: { symbol: 'PYPL', name: 'PayPal Holdings', beta: 1.42, sector: 'Financials', industry: 'Payments' },
  UBER: { symbol: 'UBER', name: 'Uber Technologies', beta: 1.36, sector: 'Technology', industry: 'Mobility' },
  SPOT: { symbol: 'SPOT', name: 'Spotify Technology', beta: 1.58, sector: 'Communication Services', industry: 'Streaming' },
  BABA: { symbol: 'BABA', name: 'Alibaba Group', beta: 0.39, sector: 'Consumer Discretionary', industry: 'E-Commerce' },
  TSM: { symbol: 'TSM', name: 'Taiwan Semiconductor', beta: 1.17, sector: 'Technology', industry: 'Semiconductors' },
  ASML: { symbol: 'ASML', name: 'ASML Holding', beta: 1.12, sector: 'Technology', industry: 'Semiconductor Equipment' },
  CRM: { symbol: 'CRM', name: 'Salesforce', beta: 1.28, sector: 'Technology', industry: 'Software' },

  // ── Brazil (B3) ──────────────────────────────────────────────────────────
  'PETR4.SA': { symbol: 'PETR4.SA', name: 'Petrobras PN',        price: 38.20,  change: 0.45,  changePercent: 1.19,  sector: 'Energy',      industry: 'Oil & Gas', beta: 1.42, marketCap: 490_000_000_000, peRatio: 4.8,  eps: 7.96, dividendYield: 14.2, volume: 85_000_000,  avgVolume: 92_000_000,  high52w: 42.10, low52w: 30.50, previousClose: 37.75, open: 37.90, dayHigh: 38.50, dayLow: 37.60 },
  'VALE3.SA': { symbol: 'VALE3.SA', name: 'Vale ON',              price: 58.80,  change: -0.60, changePercent: -1.01, sector: 'Materials',   industry: 'Mining',    beta: 1.28, marketCap: 270_000_000_000, peRatio: 6.2,  eps: 9.48, dividendYield: 11.8, volume: 65_000_000,  avgVolume: 72_000_000,  high52w: 72.40, low52w: 52.20, previousClose: 59.40, open: 59.20, dayHigh: 59.80, dayLow: 58.40 },
  'ITUB4.SA': { symbol: 'ITUB4.SA', name: 'Itaú Unibanco PN',    price: 34.60,  change: 0.28,  changePercent: 0.82,  sector: 'Financials',  industry: 'Banking',   beta: 0.98, marketCap: 340_000_000_000, peRatio: 8.4,  eps: 4.12, dividendYield: 7.8,  volume: 55_000_000,  avgVolume: 60_000_000,  high52w: 37.80, low52w: 28.90, previousClose: 34.32, open: 34.45, dayHigh: 34.75, dayLow: 34.20 },
  'BBDC4.SA': { symbol: 'BBDC4.SA', name: 'Bradesco PN',         price: 14.85,  change: 0.15,  changePercent: 1.02,  sector: 'Financials',  industry: 'Banking',   beta: 1.05, marketCap: 125_000_000_000, peRatio: 7.1,  eps: 2.09, dividendYield: 9.2,  volume: 48_000_000,  avgVolume: 52_000_000,  high52w: 17.20, low52w: 12.40, previousClose: 14.70, open: 14.75, dayHigh: 14.95, dayLow: 14.60 },
  'ABEV3.SA': { symbol: 'ABEV3.SA', name: 'Ambev ON',            price: 11.40,  change: -0.10, changePercent: -0.87, sector: 'Consumer',    industry: 'Beverages', beta: 0.72, marketCap: 180_000_000_000, peRatio: 14.2, eps: 0.80, dividendYield: 5.4,  volume: 40_000_000,  avgVolume: 45_000_000,  high52w: 14.50, low52w: 10.20, previousClose: 11.50, open: 11.45, dayHigh: 11.55, dayLow: 11.30 },
  'WEGE3.SA': { symbol: 'WEGE3.SA', name: 'WEG ON',              price: 48.20,  change: 0.90,  changePercent: 1.90,  sector: 'Industrials', industry: 'Motors',    beta: 0.88, marketCap: 195_000_000_000, peRatio: 32.1, eps: 1.50, dividendYield: 1.8,  volume: 12_000_000,  avgVolume: 14_000_000,  high52w: 54.00, low52w: 38.10, previousClose: 47.30, open: 47.50, dayHigh: 48.40, dayLow: 47.20 },
  'RENT3.SA': { symbol: 'RENT3.SA', name: 'Localiza ON',         price: 42.50,  change: -0.30, changePercent: -0.70, sector: 'Consumer',    industry: 'Car Rental',beta: 1.12, marketCap: 42_000_000_000,  peRatio: 18.4, eps: 2.31, dividendYield: 1.2,  volume: 8_000_000,   avgVolume: 9_500_000,   high52w: 52.80, low52w: 36.40, previousClose: 42.80, open: 42.60, dayHigh: 42.90, dayLow: 42.20 },
  'MGLU3.SA': { symbol: 'MGLU3.SA', name: 'Magazine Luiza ON',   price: 8.45,   change: 0.35,  changePercent: 4.32,  sector: 'Consumer',    industry: 'Retail',    beta: 1.85, marketCap: 36_000_000_000,  peRatio: 0,    eps: -0.12, dividendYield: 0,    volume: 95_000_000,  avgVolume: 110_000_000, high52w: 12.40, low52w: 5.80,  previousClose: 8.10,  open: 8.20,  dayHigh: 8.60,  dayLow: 8.10 },
  'LREN3.SA': { symbol: 'LREN3.SA', name: 'Lojas Renner ON',     price: 15.20,  change: 0.20,  changePercent: 1.33,  sector: 'Consumer',    industry: 'Apparel',   beta: 1.22, marketCap: 18_000_000_000,  peRatio: 12.8, eps: 1.19, dividendYield: 3.4,  volume: 14_000_000,  avgVolume: 16_000_000,  high52w: 19.80, low52w: 12.90, previousClose: 15.00, open: 15.10, dayHigh: 15.35, dayLow: 15.00 },
  'B3SA3.SA': { symbol: 'B3SA3.SA', name: 'B3 SA ON',            price: 10.80,  change: 0.05,  changePercent: 0.47,  sector: 'Financials',  industry: 'Exchange',  beta: 0.92, marketCap: 58_000_000_000,  peRatio: 14.6, eps: 0.74, dividendYield: 5.8,  volume: 38_000_000,  avgVolume: 42_000_000,  high52w: 13.40, low52w: 9.60,  previousClose: 10.75, open: 10.78, dayHigh: 10.90, dayLow: 10.70 },

  // ── United Kingdom (LSE) ──────────────────────────────────────────────────
  'HSBA.L':  { symbol: 'HSBA.L',  name: 'HSBC Holdings',        price: 782.0,  change: 5.2,   changePercent: 0.67,  sector: 'Financials',  industry: 'Banking',   beta: 0.82, marketCap: 148_000_000_000, peRatio: 8.2,  eps: 95.4, dividendYield: 6.8, volume: 22_000_000, avgVolume: 25_000_000, high52w: 850.0, low52w: 620.0, previousClose: 776.8, open: 778.0, dayHigh: 785.0, dayLow: 775.0 },
  'BP.L':    { symbol: 'BP.L',    name: 'BP plc',               price: 418.0,  change: -2.5,  changePercent: -0.60, sector: 'Energy',      industry: 'Oil & Gas', beta: 0.74, marketCap: 82_000_000_000,  peRatio: 7.8,  eps: 53.6, dividendYield: 5.2, volume: 18_000_000, avgVolume: 22_000_000, high52w: 510.0, low52w: 380.0, previousClose: 420.5, open: 420.0, dayHigh: 422.0, dayLow: 416.0 },
  'SHEL.L':  { symbol: 'SHEL.L',  name: 'Shell plc',            price: 2680.0, change: 12.0,  changePercent: 0.45,  sector: 'Energy',      industry: 'Oil & Gas', beta: 0.68, marketCap: 196_000_000_000, peRatio: 10.2, eps: 262.7, dividendYield: 3.8, volume: 8_000_000,  avgVolume: 10_000_000, high52w: 2920.0, low52w: 2290.0, previousClose: 2668.0, open: 2672.0, dayHigh: 2690.0, dayLow: 2665.0 },
  'AZN.L':   { symbol: 'AZN.L',   name: 'AstraZeneca plc',      price: 12200.0,change: 80.0,  changePercent: 0.66,  sector: 'Healthcare',  industry: 'Pharma',    beta: 0.48, marketCap: 192_000_000_000, peRatio: 32.4, eps: 376.5, dividendYield: 1.9, volume: 2_500_000,  avgVolume: 3_000_000,  high52w: 13400.0, low52w: 9800.0, previousClose: 12120.0, open: 12150.0, dayHigh: 12250.0, dayLow: 12100.0 },

  // ── Germany (XETRA) ───────────────────────────────────────────────────────
  'SAP.DE':  { symbol: 'SAP.DE',  name: 'SAP SE',               price: 228.0,  change: 2.4,   changePercent: 1.06,  sector: 'Technology',  industry: 'Enterprise Software', beta: 0.92, marketCap: 278_000_000_000, peRatio: 42.8, eps: 5.33, dividendYield: 1.4, volume: 1_800_000, avgVolume: 2_200_000, high52w: 248.0, low52w: 168.0, previousClose: 225.6, open: 226.0, dayHigh: 229.0, dayLow: 225.0 },
  'BMW.DE':  { symbol: 'BMW.DE',  name: 'Bayerische Motoren Werke', price: 82.4, change: -0.8, changePercent: -0.96, sector: 'Consumer',    industry: 'Automobiles', beta: 1.18, marketCap: 52_000_000_000, peRatio: 5.8, eps: 14.21, dividendYield: 8.4, volume: 2_200_000, avgVolume: 2_800_000, high52w: 98.0, low52w: 72.0, previousClose: 83.2, open: 83.0, dayHigh: 83.5, dayLow: 82.0 },
  'SIE.DE':  { symbol: 'SIE.DE',  name: 'Siemens AG',           price: 186.0,  change: 1.2,   changePercent: 0.65,  sector: 'Industrials', industry: 'Conglomerate', beta: 1.06, marketCap: 150_000_000_000, peRatio: 18.2, eps: 10.22, dividendYield: 2.8, volume: 1_500_000, avgVolume: 1_800_000, high52w: 205.0, low52w: 155.0, previousClose: 184.8, open: 185.0, dayHigh: 187.0, dayLow: 184.5 },

  // ── Japan (TSE) ───────────────────────────────────────────────────────────
  '7203.T':  { symbol: '7203.T',  name: 'Toyota Motor Corp',    price: 3540.0, change: 25.0,  changePercent: 0.71,  sector: 'Consumer',    industry: 'Automobiles', beta: 0.86, marketCap: 50_000_000_000_000, peRatio: 8.8, eps: 402.3, dividendYield: 2.8, volume: 8_000_000, avgVolume: 10_000_000, high52w: 4060.0, low52w: 2800.0, previousClose: 3515.0, open: 3520.0, dayHigh: 3560.0, dayLow: 3510.0 },
  '9984.T':  { symbol: '9984.T',  name: 'SoftBank Group Corp',  price: 10200.0,change: 120.0, changePercent: 1.19,  sector: 'Technology',  industry: 'Telecom',    beta: 1.42, marketCap: 17_000_000_000_000, peRatio: 0, eps: -280.0, dividendYield: 0.8, volume: 12_000_000, avgVolume: 15_000_000, high52w: 11800.0, low52w: 7200.0, previousClose: 10080.0, open: 10100.0, dayHigh: 10280.0, dayLow: 10080.0 },

  // ── Hong Kong (HKEX) ──────────────────────────────────────────────────────
  '0700.HK': { symbol: '0700.HK', name: 'Tencent Holdings',     price: 398.0,  change: 4.2,   changePercent: 1.07,  sector: 'Technology',  industry: 'Internet',   beta: 1.12, marketCap: 382_000_000_000, peRatio: 18.4, eps: 21.63, dividendYield: 1.2, volume: 18_000_000, avgVolume: 22_000_000, high52w: 468.0, low52w: 280.0, previousClose: 393.8, open: 395.0, dayHigh: 400.0, dayLow: 394.0 },
  '9988.HK': { symbol: '9988.HK', name: 'Alibaba Group',        price: 82.0,   change: -1.2,  changePercent: -1.44, sector: 'Technology',  industry: 'E-commerce', beta: 1.28, marketCap: 205_000_000_000, peRatio: 14.2, eps: 5.77, dividendYield: 1.8, volume: 25_000_000, avgVolume: 30_000_000, high52w: 120.0, low52w: 60.0, previousClose: 83.2, open: 83.0, dayHigh: 83.5, dayLow: 81.0 },
};

// Kept in the same soft, desaturated family as the app's design tokens
// (--accent, --green, --amber, --red, --violet in index.css) so this chart
// reads as part of the product rather than a generic chart-library rainbow.
// Every entry has its own distinct color — the previous version left
// Industrials at the exact same hex as the "sector not found" fallback below,
// so any unmapped sector (e.g. Open Finance's "Fixed Income") silently
// rendered identically to Industrials with no way to tell them apart.
export const SECTOR_COLORS: Record<string, string> = {
  Technology: '#8aa4ff',
  'Communication Services': '#a896ff',
  'Consumer Discretionary': '#e2915c',
  'Consumer Staples': '#8ea677',
  Financials: '#5ecfc4',
  Healthcare: '#e08fc2',
  Energy: '#d7a955',
  Utilities: '#b8c95e',
  'Real Estate': '#c9a2ff',
  Industrials: '#7da7ff',
  Materials: '#c48a5e',
  ETF: '#6fb3d9',
  'Fixed Income': '#55d99a',
  Unknown: '#5b6577',
};

/** Fallback for a sector name with no explicit entry above — distinct from
 * every mapped color (including Industrials) so it never silently collides. */
export const SECTOR_FALLBACK_COLOR = '#ec6f86';

export const POPULAR_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
  'JPM', 'GS', 'XOM', 'JNJ', 'KO', 'AMD', 'INTC', 'V', 'BRK.B',
  'DIS', 'PYPL', 'UBER', 'SPOT', 'BABA', 'TSM', 'ASML', 'CRM',
];

export const DEFAULT_WATCHLIST: string[] = [
  'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META',
  'PETR4.SA', 'VALE3.SA', 'ITUB4.SA',   // Brazil
  'HSBA.L', 'SAP.DE',                    // Europe
  '0700.HK',                             // Hong Kong
];
