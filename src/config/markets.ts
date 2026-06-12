export interface Market {
  id: string;
  name: string;
  flag: string;
  suffix: string;
  currency: string;
  currencySymbol: string;
  benchmarkTicker: string;
  timezone: string;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

export const MARKETS: Market[] = [
  {
    id: 'US', name: 'United States (NYSE/NASDAQ)', flag: '🇺🇸',
    suffix: '', currency: 'USD', currencySymbol: '$',
    benchmarkTicker: 'SPY', timezone: 'America/New_York',
    openHour: 9, openMinute: 30, closeHour: 16, closeMinute: 0,
  },
  {
    id: 'BR', name: 'Brasil (B3)', flag: '🇧🇷',
    suffix: '.SA', currency: 'BRL', currencySymbol: 'R$',
    benchmarkTicker: 'BOVA11.SA', timezone: 'America/Sao_Paulo',
    openHour: 10, openMinute: 0, closeHour: 17, closeMinute: 55,
  },
  {
    id: 'UK', name: 'United Kingdom (LSE)', flag: '🇬🇧',
    suffix: '.L', currency: 'GBP', currencySymbol: '£',
    benchmarkTicker: 'ISF.L', timezone: 'Europe/London',
    openHour: 8, openMinute: 0, closeHour: 16, closeMinute: 30,
  },
  {
    id: 'DE', name: 'Germany (XETRA)', flag: '🇩🇪',
    suffix: '.DE', currency: 'EUR', currencySymbol: '€',
    benchmarkTicker: 'EXS1.DE', timezone: 'Europe/Berlin',
    openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 30,
  },
  {
    id: 'FR', name: 'France (Euronext)', flag: '🇫🇷',
    suffix: '.PA', currency: 'EUR', currencySymbol: '€',
    benchmarkTicker: 'CAC.PA', timezone: 'Europe/Paris',
    openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 30,
  },
  {
    id: 'JP', name: 'Japan (TSE)', flag: '🇯🇵',
    suffix: '.T', currency: 'JPY', currencySymbol: '¥',
    benchmarkTicker: '1306.T', timezone: 'Asia/Tokyo',
    openHour: 9, openMinute: 0, closeHour: 15, closeMinute: 30,
  },
  {
    id: 'HK', name: 'Hong Kong (HKEX)', flag: '🇭🇰',
    suffix: '.HK', currency: 'HKD', currencySymbol: 'HK$',
    benchmarkTicker: '2800.HK', timezone: 'Asia/Hong_Kong',
    openHour: 9, openMinute: 30, closeHour: 16, closeMinute: 0,
  },
];

export function getMarketFromTicker(ticker: string): Market {
  const upper = ticker.toUpperCase();
  return (
    MARKETS.find(m => m.suffix && upper.endsWith(m.suffix)) ??
    MARKETS.find(m => m.id === 'US')!
  );
}

export function displayTicker(ticker: string): string {
  const market = getMarketFromTicker(ticker);
  if (!market.suffix) return ticker;
  return ticker.replace(new RegExp(`\\${market.suffix}$`, 'i'), '');
}

export function addSuffix(baseTicker: string, marketId: string): string {
  const market = MARKETS.find(m => m.id === marketId);
  if (!market || !market.suffix) return baseTicker.toUpperCase();
  const upper = baseTicker.toUpperCase();
  if (upper.endsWith(market.suffix.toUpperCase())) return upper;
  return upper + market.suffix;
}

export function formatTickerPrice(value: number, ticker: string): string {
  const market = getMarketFromTicker(ticker);
  return `${market.currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getMarketStatus(market: Market): { isOpen: boolean; label: string; color: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: market.timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value ?? '';
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const totalMinutes = hour * 60 + minute;
  const openMinutes = market.openHour * 60 + market.openMinute;
  const closeMinutes = market.closeHour * 60 + market.closeMinute;
  const isOpen = !isWeekend && totalMinutes >= openMinutes && totalMinutes < closeMinutes;
  return {
    isOpen,
    label: isOpen ? `${market.name.split('(')[0].trim()} Open` : `${market.name.split('(')[0].trim()} Closed`,
    color: isOpen ? '#55d99a' : 'rgba(255,255,255,0.3)',
  };
}
