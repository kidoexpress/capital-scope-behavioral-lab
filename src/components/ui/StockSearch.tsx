import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { STOCK_DATABASE } from '../../data/mockStocks';
import { MARKETS, addSuffix, displayTicker } from '../../config/markets';
import { usePortfolioStore } from '../../store/portfolioStore';

interface Props {
  onSelect: (ticker: string) => void;
  placeholder?: string;
}

export default function StockSearch({ onSelect, placeholder = 'Search ticker...' }: Props) {
  const { activeMarketId } = usePortfolioStore();
  const market = MARKETS.find(m => m.id === activeMarketId) ?? MARKETS[0];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ symbol: string; name: string; sector: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setQuery(''); setResults([]); }, [activeMarketId]);

  const handleChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) { setResults([]); return; }
    const q = value.toLowerCase();
    const filtered = Object.values(STOCK_DATABASE)
      .filter(s => {
        const sym = (s.symbol ?? '').toLowerCase();
        const name = (s.name ?? '').toLowerCase();
        if (activeMarketId === 'US') return !sym.includes('.') && (sym.includes(q) || name.includes(q));
        const suffix = market.suffix.toLowerCase();
        return sym.endsWith(suffix) && (sym.includes(q) || name.includes(q) || displayTicker(sym).toLowerCase().includes(q));
      })
      .map(s => ({ symbol: s.symbol ?? '', name: s.name ?? '', sector: s.sector ?? '' }))
      .slice(0, 8);
    if (filtered.length === 0 && value.trim().length >= 1) {
      const raw = value.trim().toUpperCase().replace(/\.(SA|L|DE|PA|T|HK)$/i, '');
      filtered.push({ symbol: addSuffix(raw, activeMarketId), name: `Search live: ${addSuffix(raw, activeMarketId)}`, sector: market.name });
    }
    setResults(filtered);
  };

  const handleSelect = (symbol: string) => { onSelect(symbol); setQuery(''); setResults([]); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', gap: 6, alignItems: 'center' }}>
      <div
        title={`Active market: ${market.name}. Change in sidebar.`}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '0 8px', height: 36, borderRadius: 8,
          background: 'rgba(138,164,255,0.12)', border: '1px solid var(--accent)',
          fontSize: 11, fontWeight: 600, color: 'var(--accent)',
          fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 15 }}>{market.flag}</span>
        <span>{market.id}</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <span>{market.currencySymbol}</span>
      </div>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lo)', pointerEvents: 'none' }} />
        <input
          type="text" value={query} onChange={e => handleChange(e.target.value)}
          placeholder={placeholder} style={{ paddingLeft: 32, width: '100%' }}
          autoComplete="off" spellCheck={false}
        />
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            zIndex: 9999, background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {results.map(r => (
              <button
                key={r.symbol}
                onMouseDown={e => { e.preventDefault(); handleSelect(r.symbol); }}
                style={{
                  width: '100%', padding: '9px 12px', textAlign: 'left',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: 'var(--text-hi)', minWidth: 80, flexShrink: 0 }}>
                  {displayTicker(r.symbol)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-lo)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-lo)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
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
