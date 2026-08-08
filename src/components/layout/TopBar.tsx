import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Command, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { searchYahooSymbols, type SymbolSearchResult } from '../../services/marketDataService';
import { displayTicker, getMarketFromTicker } from '../../config/markets';

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/':                  { title: 'Capital Scope Behavioral Lab', crumb: 'Home' },
  '/analyzer':          { title: 'Stock Analyzer',  crumb: 'Analyzer'    },
  '/portfolio':         { title: 'Portfolio',       crumb: 'Builder'     },
  '/risk':              { title: 'Risk',             crumb: 'Dashboard'   },
  '/montecarlo':        { title: 'Monte Carlo',      crumb: 'Lab'         },
  '/scenarios':         { title: 'Scenarios',        crumb: 'Simulator'   },
  '/watchlist':         { title: 'Watchlist',        crumb: 'Tracker'     },
  '/agents/earnings':   { title: 'Earnings Reviewer', crumb: 'AI Agent'  },
  '/agents/research':   { title: 'Market Research',  crumb: 'AI Agent'   },
  '/agents/model':      { title: 'Model Builder',    crumb: 'AI Agent'   },
  '/research':          { title: 'Deep Dive',    crumb: 'Research'  },
  '/scanner':           { title: 'Gold Scanner', crumb: 'Discovery' },
  '/public-portfolios': { title: 'Public Books', crumb: 'Tracker' },
  '/synthetic-lab':     { title: 'Financial Twin Lab', crumb: 'Lab' },
  '/synthetic-portfolio-lab': { title: 'Synthetic Portfolio Lab', crumb: 'Lab' },
  '/terminal':          { title: 'Terminal',         crumb: 'Command Mode'},
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = PAGE_META[location.pathname] ?? { title: 'Capital Scope Behavioral Lab', crumb: '' };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  // Debounced GLOBAL live search — every exchange Yahoo indexes, plus brand aliases.
  useEffect(() => {
    const value = query.trim();
    if (!value) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const id = ++reqId.current;
    const timer = window.setTimeout(async () => {
      const hits = await searchYahooSymbols(value); // undefined suffix = global
      if (id !== reqId.current) return;
      setResults(hits.slice(0, 8));
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        setFocused(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (ticker: string) => {
    navigate(`/analyzer?ticker=${encodeURIComponent(ticker)}`);
    setQuery('');
    setResults([]);
    setOpen(false);
    setFocused(false);
  };

  return (
    <header className="topbar-shell">
      <div className="topbar-inner">
      <div className="topbar-title">
        <span>{meta.title}</span>
        {meta.crumb && (
          <>
            <small>/</small>
            <em>{meta.crumb}</em>
          </>
        )}
      </div>

      <div ref={containerRef} className="topbar-search">
        <div className={focused ? 'topbar-search-box focused' : 'topbar-search-box'}>
          <Search size={13} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            placeholder="Search ticker or company…"
            className="flex-1 bg-transparent text-xs outline-none"
          />
          {loading
            ? <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-lo)' }} />
            : (
              <div className="topbar-kbd">
                <Command size={9} />
                <span className="font-mono text-[9px]">K</span>
              </div>
            )}
        </div>

        {/* Dropdown results */}
        {open && results.length > 0 && (
          <div className="topbar-results">
            {results.map(r => {
              const mkt = getMarketFromTicker(r.symbol);
              return (
                <button
                  key={r.symbol}
                  onClick={() => handleSelect(r.symbol)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="font-mono text-xs font-bold shrink-0" style={{ color: 'var(--accent)', minWidth: 64 }}>
                    {displayTicker(r.symbol)}
                  </span>
                  <span className="text-xs truncate" style={{ color: 'var(--text-mid)' }}>
                    {r.name}
                  </span>
                  <span className="ml-auto text-[10px] shrink-0 flex items-center gap-1" style={{ color: 'var(--text-lo)' }}>
                    <span>{mkt.flag}</span>
                    <span>{r.sector}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <div className="market-date">
          <div className="w-1.5 h-1.5 rounded-full pulse-live" />
          <span className="font-mono text-[10px] font-semibold">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {[Bell].map((Icon, i) => (
          <button
            key={i}
            className="topbar-icon-button"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
      </div>
    </header>
  );
}
