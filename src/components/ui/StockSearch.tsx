import { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { STOCK_DATABASE } from '../../data/mockStocks';
import { MARKETS, addSuffix, displayTicker } from '../../config/markets';
import { usePortfolioStore } from '../../store/portfolioStore';
import { searchYahooSymbols, type SymbolSearchResult } from '../../services/marketDataService';

interface Props {
  onSelect: (ticker: string) => void;
  placeholder?: string;
}

export default function StockSearch({ onSelect, placeholder = 'Search ticker...' }: Props) {
  const { activeMarketId } = usePortfolioStore();
  const market = MARKETS.find(m => m.id === activeMarketId) ?? MARKETS[0];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset when the market changes.
  useEffect(() => {
    setQuery('');
    setResults([]);
  }, [activeMarketId]);

  // Instant local matches from the bundled database — shown while the live
  // Yahoo search request (which covers every listed company) is in flight.
  function localMatches(value: string): SymbolSearchResult[] {
    const q = value.toLowerCase();
    return Object.values(STOCK_DATABASE)
      .filter(s => {
        const sym = (s.symbol ?? '').toLowerCase();
        const name = (s.name ?? '').toLowerCase();
        if (activeMarketId === 'US') {
          return !sym.includes('.') && (sym.includes(q) || name.includes(q));
        }
        const suffix = market.suffix.toLowerCase();
        return sym.endsWith(suffix) && (
          sym.includes(q) || name.includes(q) || displayTicker(sym).toLowerCase().includes(q)
        );
      })
      .map(s => ({ symbol: s.symbol ?? '', name: s.name ?? '', sector: s.sector ?? '' }))
      .slice(0, 8);
  }

  // Debounced live search against Yahoo, scoped to the active market.
  useEffect(() => {
    const value = query.trim();
    if (!value) { setResults([]); setLoading(false); return; }

    setResults(localMatches(value));
    setLoading(true);
    const id = ++reqId.current;
    const timer = window.setTimeout(async () => {
      const live = await searchYahooSymbols(value, market.suffix);
      if (id !== reqId.current) return; // a newer keystroke superseded this one
      // Merge live results over local, de-duplicated by symbol.
      const seen = new Set<string>();
      const merged: SymbolSearchResult[] = [];
      for (const r of [...live, ...localMatches(value)]) {
        const key = r.symbol.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(r);
      }
      // Last-resort: offer the raw typed ticker with the market suffix applied.
      if (merged.length === 0) {
        const raw = value.toUpperCase().replace(/\.(SA|L|DE|PA|T|HK)$/i, '');
        merged.push({ symbol: addSuffix(raw, activeMarketId), name: `Search: ${addSuffix(raw, activeMarketId)}`, sector: market.name });
      }
      setResults(merged.slice(0, 10));
      setLoading(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, activeMarketId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', gap: 6, alignItems: 'center' }}>
      {/* Passive market badge — no dropdown, no interaction */}
      <div
        title={`Active market: ${market.name} (${market.currencySymbol}). Change in sidebar.`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 8px',
          height: 36,
          borderRadius: 'var(--border-radius-md, 8px)',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--accent)',
          fontFamily: 'JetBrains Mono, monospace',
          flexShrink: 0,
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 15 }}>{market.flag}</span>
        <span>{market.id}</span>
        <span style={{ opacity: 0.7 }}>·</span>
        <span>{market.currencySymbol}</span>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-lo)',
            pointerEvents: 'none',
          }}
        />
        {loading && (
          <Loader2
            size={14}
            className="animate-spin"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lo)', pointerEvents: 'none' }}
          />
        )}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{ paddingLeft: 32, width: '100%' }}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Results dropdown */}
        {results.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-sub)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {results.map(r => (
              <button
                key={r.symbol}
                onMouseDown={e => { e.preventDefault(); handleSelect(r.symbol); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderBottom: '1px solid var(--border-dim)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'var(--text-hi)',
                  minWidth: 80,
                  flexShrink: 0,
                }}>
                  {displayTicker(r.symbol)}
                </span>
                <span style={{
                  fontSize: 12,
                  color: 'var(--text-lo)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {r.name}
                </span>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-lo)',
                  background: 'var(--bg-raised)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  {r.sector}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
