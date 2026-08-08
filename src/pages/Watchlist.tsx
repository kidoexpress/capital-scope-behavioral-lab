import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolioStore';
import { getStockQuote } from '../utils/api';
import { DATA_SOURCE_LABEL, getSparkline } from '../services/marketDataService';
import { formatCurrency, formatMarketCap, formatPercent, formatVolume, formatPrice, formatMarketCapForTicker } from '../utils/finance';
import StockSearch from '../components/ui/StockSearch';
import Sparkline from '../components/charts/Sparkline';
import type { StockQuote } from '../types';

interface WatchlistQuote extends StockQuote {
  sparkline: number[];
}

function getSentiment(gainers: number, losers: number) {
  if (gainers > losers + 1) return { label: 'Constructive', score: 72, tone: 'positive' };
  if (losers > gainers + 1) return { label: 'Defensive', score: 38, tone: 'negative' };
  return { label: 'Mixed', score: 54, tone: 'neutral' };
}

function LoadingCards() {
  return (
    <div className="watch-card-grid">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="watch-stock-card">
          <div className="shimmer h-7 w-24 rounded-full" />
          <div className="shimmer mt-8 h-12 rounded-2xl" />
          <div className="shimmer mt-8 h-24 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export default function Watchlist() {
  const navigate = useNavigate();
  const { watchlist, addToWatchlist, removeFromWatchlist } = usePortfolioStore();
  const [quotes, setQuotes] = useState<Record<string, WatchlistQuote>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(watchlist[0] ?? 'AAPL');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQuotes = async (syms: string[]) => {
    setError(null);
    const results: Record<string, WatchlistQuote> = {};
    await Promise.all(syms.map(async sym => {
      const quote = await getStockQuote(sym);
      if (quote) {
        const sparkline = await getSparkline(sym, '1M').catch(() => []);
        results[sym] = {
          ...quote,
          sparkline: sparkline.length ? sparkline : [quote.price],
        };
      }
    }));
    setQuotes(results);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    if (Object.keys(results).length === 0 && syms.length > 0) {
      setError('Market data unavailable from Yahoo Finance.');
    }
    setLoading(false);
    setRefreshing(false);
    if (!selectedSymbol || !results[selectedSymbol]) {
      setSelectedSymbol(Object.keys(results)[0] ?? '');
    }
  };

  useEffect(() => {
    void loadQuotes(watchlist);
  }, [watchlist.join(',')]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuotes(watchlist);
  };

  const sorted = useMemo(() => Object.values(quotes).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)), [quotes]);
  const selected = quotes[selectedSymbol] ?? sorted[0];
  const gainers = sorted.filter(q => q.changePercent > 0).length;
  const losers = sorted.filter(q => q.changePercent < 0).length;
  const sentiment = getSentiment(gainers, losers);
  const avgMove = sorted.length ? sorted.reduce((sum, q) => sum + q.changePercent, 0) / sorted.length : 0;
  const topGainer = sorted.filter(q => q.changePercent >= 0).sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoser = sorted.filter(q => q.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent)[0];
  const selectedRange = selected ? selected.high52w - selected.low52w : 0;
  const selectedRangePos = selected && selectedRange > 0 ? ((selected.price - selected.low52w) / selectedRange) * 100 : 50;

  return (
    <div className="workflow-page watchlist-page animate-fade-in-up">
      <section className="watch-hero">
        <div className="watch-hero-copy">
          <div className="market-open-pill">
            <span className="pulse-live" />
            {DATA_SOURCE_LABEL}{lastUpdated ? ` · Last updated ${lastUpdated}` : ''}
          </div>
          <h1>Market Watch</h1>
          <p>A calmer market intelligence workspace for tracking priority names, price action, and institutional-style context.</p>
          <div className="watch-search-shell">
            <Search size={17} />
            <StockSearch
              onSelect={sym => {
                addToWatchlist(sym);
                setSelectedSymbol(sym);
              }}
              placeholder="Search ticker or company..."
            />
          </div>
        </div>

        <div className="market-mood-card">
          <div className="mood-header">
            <div>
              <span className="label-upper">Market Mood</span>
              <strong className={sentiment.tone}>{sentiment.label}</strong>
            </div>
            <button onClick={handleRefresh} className="mood-refresh">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <div
            className={`sentiment-gauge ${sentiment.tone}`}
            role="img"
            aria-label={`Market mood score ${sentiment.score} of 100 — ${sentiment.label}`}
          >
            <svg viewBox="0 0 158 158" aria-hidden="true">
              <circle className="gauge-track" cx="79" cy="79" r="70" />
              <circle
                className="gauge-fill"
                cx="79"
                cy="79"
                r="70"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - sentiment.score / 100)}
              />
            </svg>
            <span>{sentiment.score}</span>
          </div>
          <div className="breadth-row">
            <div>
              <span>Advancing</span>
              <strong>{gainers}</strong>
            </div>
            <div>
              <span>Declining</span>
              <strong>{losers}</strong>
            </div>
            <div>
              <span>Avg move</span>
              <strong className={avgMove >= 0 ? 'positive' : 'negative'}>{avgMove >= 0 ? '+' : ''}{avgMove.toFixed(2)}%</strong>
            </div>
          </div>
          <div className="breadth-bar">
            <i style={{ width: `${sorted.length ? (gainers / sorted.length) * 100 : 50}%` }} />
          </div>
        </div>
      </section>

      {error && (
        <div className="paper-error-banner">
          <Activity size={17} />
          <div>
            <strong>Market data unavailable</strong>
            <span>{error}</span>
          </div>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      <section className="watch-overview-strip">
        <div>
          <span>Watching</span>
          <strong>{watchlist.length}</strong>
          <em>tracked names</em>
        </div>
        <div>
          <span>Top gainer</span>
          <strong>{topGainer?.symbol ?? '—'}</strong>
          <em className="positive">{topGainer ? formatPercent(topGainer.changePercent) : '—'}</em>
        </div>
        <div>
          <span>Top decliner</span>
          <strong>{topLoser?.symbol ?? '—'}</strong>
          <em className="negative">{topLoser ? formatPercent(topLoser.changePercent) : '—'}</em>
        </div>
        <div>
          <span>Institutional flow</span>
          <strong>{avgMove >= 0 ? 'Risk-on' : 'Risk-off'}</strong>
          <em>{gainers}/{sorted.length || 0} advancing</em>
        </div>
      </section>

      <section className="watch-workspace-grid">
        <div className="watch-main-panel">
          <div className="watch-section-header">
            <div>
              <span className="label-upper">Priority Names</span>
              <h2>Live Watchlist</h2>
            </div>
            <span>Click a card to open the intelligence panel.</span>
          </div>

          {loading ? <LoadingCards /> : sorted.length === 0 ? (
            <div className="intentional-empty-state">
              <Star size={22} />
              <strong>Your watchlist is empty.</strong>
              <span>Search and add tickers above to build your market workspace.</span>
            </div>
          ) : (
            <div className="watch-card-grid">
              {sorted.map(quote => {
                const active = selected?.symbol === quote.symbol;
                return (
                  <button
                    key={quote.symbol}
                    onClick={() => setSelectedSymbol(quote.symbol)}
                    className={`watch-stock-card ${active ? 'active' : ''} ${quote.changePercent >= 0 ? 'up' : 'down'}`}
                  >
                    <div className="watch-card-top">
                      <div>
                        <strong>{quote.symbol}</strong>
                        <span>{quote.name}</span>
                      </div>
                      <Star size={15} fill="currentColor" />
                    </div>
                    <div className="watch-price-row">
                      <span>{formatPrice(quote.price, quote.symbol)}</span>
                      <em className={quote.changePercent >= 0 ? 'positive' : 'negative'}>
                        {quote.changePercent >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                        {formatPercent(quote.changePercent)}
                      </em>
                    </div>
                    <div className="watch-sparkline-wrap">
                      <Sparkline data={quote.sparkline} positive={quote.changePercent >= 0} width="100%" height={72} />
                    </div>
                    <div className="watch-card-metrics">
                      <div><span>Volume</span><strong>{formatVolume(quote.volume)}</strong></div>
                      <div><span>Mkt Cap</span><strong>{quote.marketCap > 0 ? formatMarketCapForTicker(quote.marketCap, quote.symbol) : '—'}</strong></div>
                      <div><span>P/E</span><strong>{quote.peRatio > 0 ? quote.peRatio.toFixed(1) : '—'}</strong></div>
                      <div><span>Beta</span><strong>{quote.beta.toFixed(2)}</strong></div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="watch-insight-panel">
          {selected ? (
            <>
              <div className="selected-stock-hero">
                <div className="selected-title-row">
                  <div>
                    <span>{selected.sector}</span>
                    <h2>{selected.symbol}</h2>
                    <p>{selected.name}</p>
                  </div>
                  <button onClick={() => navigate(`/analyzer?ticker=${selected.symbol}`)}><Eye size={16} /></button>
                </div>
                <div className="selected-price">
                  <strong>{formatPrice(selected.price, selected.symbol)}</strong>
                  <em className={selected.changePercent >= 0 ? 'positive' : 'negative'}>
                    {selected.changePercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {formatPercent(selected.changePercent)}
                  </em>
                </div>
                <Sparkline data={selected.sparkline} positive={selected.changePercent >= 0} width="100%" height={110} />
              </div>

              <div className="watch-insight-card">
                <span className="label-upper">AI Market Commentary</span>
                <p>
                  {selected.symbol} is trading {selected.changePercent >= 0 ? 'with positive momentum' : 'under pressure'} today.
                  The current move is {Math.abs(selected.changePercent) > 2 ? 'large enough to deserve catalyst review' : 'moderate and best read against sector breadth'}.
                </p>
              </div>

              <div className="watch-detail-grid">
                <div><span>Market cap</span><strong>{selected.marketCap > 0 ? formatMarketCapForTicker(selected.marketCap, selected.symbol) : '—'}</strong></div>
                <div><span>Volume</span><strong>{formatVolume(selected.volume)}</strong></div>
                <div><span>Beta</span><strong>{selected.beta.toFixed(2)}</strong></div>
                <div><span>Dividend</span><strong>{selected.dividendYield.toFixed(2)}%</strong></div>
              </div>

              <div className="range-card">
                <div>
                  <span>52-week range</span>
                  <strong>{formatPrice(selected.low52w, selected.symbol)} — {formatPrice(selected.high52w, selected.symbol)}</strong>
                </div>
                <div className="range-track">
                  <i style={{ width: `${Math.min(100, Math.max(0, selectedRangePos))}%` }} />
                </div>
              </div>

              <div className="watch-actions">
                <button onClick={() => navigate(`/analyzer?ticker=${selected.symbol}`)}><Sparkles size={15} /> Analyze</button>
                <button onClick={() => removeFromWatchlist(selected.symbol)}><Trash2 size={15} /> Remove</button>
              </div>
            </>
          ) : (
            <div className="intentional-empty-state">
              <Activity size={22} />
              <strong>Select a stock.</strong>
              <span>Contextual market intelligence will appear here.</span>
            </div>
          )}
        </aside>
      </section>

      <section className="watch-catalyst-row">
        <div className="watch-catalyst-card">
          <Zap size={18} />
          <div>
            <span>Volatility Pulse</span>
            <strong>{Math.abs(avgMove) > 1.25 ? 'Elevated' : 'Calm'}</strong>
            <p>Average move across the watchlist is {avgMove >= 0 ? '+' : ''}{avgMove.toFixed(2)}%.</p>
          </div>
        </div>
        <div className="watch-catalyst-card">
          <Activity size={18} />
          <div>
            <span>Market Breadth</span>
            <strong>{gainers}/{sorted.length || 0} advancing</strong>
            <p>Use breadth to separate isolated stock moves from broad risk appetite.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
