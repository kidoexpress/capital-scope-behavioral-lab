import { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsItem {
  id: string;
  ticker: string;
  headline: string;
  source: string;
  datetime: number;
  url: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

function classifySentiment(headline: string): NewsItem['sentiment'] {
  const h = headline.toLowerCase();
  const bullish = ['beat', 'beats', 'surges', 'rallies', 'jumps', 'upgrade', 'raises guidance', 'record', 'strong', 'gains', 'partnership', 'acquire', 'growth'];
  const bearish = ['miss', 'misses', 'falls', 'drops', 'cut', 'downgrade', 'lowers guidance', 'loss', 'weak', 'decline', 'layoffs', 'investigation', 'lawsuit', 'concern'];
  const bScore = bullish.filter(w => h.includes(w)).length;
  const beScore = bearish.filter(w => h.includes(w)).length;
  if (bScore > beScore) return 'BULLISH';
  if (beScore > bScore) return 'BEARISH';
  return 'NEUTRAL';
}

interface Props { symbols: string[] }

export default function NewsFeed({ symbols }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbols.length) return;
    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    if (!apiKey) return;
    setLoading(true);
    Promise.all(
      symbols.slice(0, 8).map(async (ticker) => {
        try {
          const to = new Date().toISOString().split('T')[0];
          const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
          const res = await fetch(
            `/api/finnhub/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${apiKey}`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (!res.ok) return [];
          const items: Array<{ id: number; headline: string; source: string; datetime: number; url: string }> = await res.json();
          return items.slice(0, 3).map(item => ({
            id: String(item.id),
            ticker,
            headline: item.headline,
            source: item.source,
            datetime: item.datetime,
            url: item.url,
            sentiment: classifySentiment(item.headline),
          } as NewsItem));
        } catch { return []; }
      })
    ).then(all => {
      const flat = all.flat().sort((a, b) => b.datetime - a.datetime).slice(0, 20);
      setNews(flat);
      setLoading(false);
    });
  }, [symbols.join(',')]);

  if (!symbols.length) return null;
  if (!import.meta.env.VITE_FINNHUB_API_KEY) return (
    <div className="card" style={{ padding: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--text-lo)' }}>
        Add <code>VITE_FINNHUB_API_KEY</code> to <code>.env.local</code> for news feed.
      </p>
    </div>
  );

  const sentimentIcon = (s: NewsItem['sentiment']) => {
    if (s === 'BULLISH') return <TrendingUp size={11} style={{ color: '#55d99a' }} />;
    if (s === 'BEARISH') return <TrendingDown size={11} style={{ color: '#ff6b6b' }} />;
    return <Minus size={11} style={{ color: 'var(--text-lo)' }} />;
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Newspaper size={16} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>News Feed</h3>
      </div>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-lo)' }}>Loading news...</p>
      ) : news.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-lo)' }}>No recent news found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
          {news.map(item => (
            <a
              key={`${item.id}-${item.ticker}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                padding: '9px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 10, color: 'var(--accent)' }}>
                    {item.ticker}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {sentimentIcon(item.sentiment)}
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: item.sentiment === 'BULLISH' ? '#55d99a' : item.sentiment === 'BEARISH' ? '#ff6b6b' : 'var(--text-lo)',
                    }}>{item.sentiment}</span>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-lo)', marginLeft: 'auto' }}>
                    {new Date(item.datetime * 1000).toLocaleDateString()} · {item.source}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-med)', lineHeight: 1.5, margin: 0 }}>
                  {item.headline}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
