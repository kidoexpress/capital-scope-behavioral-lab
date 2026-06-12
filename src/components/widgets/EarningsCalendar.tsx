import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface EarningsEntry {
  ticker: string;
  companyName: string;
  earningsDate: string | null;
  daysUntil: number | null;
  epsEstimate: number | null;
}

interface Props { symbols: string[] }

export default function EarningsCalendar({ symbols }: Props) {
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbols.length) return;
    setLoading(true);
    Promise.all(
      symbols.map(async (ticker) => {
        try {
          const res = await fetch(
            `/api/yahoo/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=calendarEvents,price`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (!res.ok) throw new Error('fetch failed');
          const json = await res.json();
          const cal = json?.quoteSummary?.result?.[0]?.calendarEvents;
          const price = json?.quoteSummary?.result?.[0]?.price;
          const earningsTimestamp = cal?.earnings?.earningsDate?.[0]?.raw;
          const earningsDate = earningsTimestamp
            ? new Date(earningsTimestamp * 1000).toISOString().split('T')[0]
            : null;
          const daysUntil = earningsTimestamp
            ? Math.ceil((earningsTimestamp * 1000 - Date.now()) / 86400000)
            : null;
          const epsEstimate = cal?.earnings?.earningsAverage?.raw ?? null;
          return {
            ticker,
            companyName: price?.shortName ?? ticker,
            earningsDate,
            daysUntil,
            epsEstimate,
          } as EarningsEntry;
        } catch {
          return { ticker, companyName: ticker, earningsDate: null, daysUntil: null, epsEstimate: null };
        }
      })
    ).then(results => {
      const sorted = results.sort((a, b) => {
        if (a.daysUntil == null) return 1;
        if (b.daysUntil == null) return -1;
        return a.daysUntil - b.daysUntil;
      });
      setEntries(sorted);
      setLoading(false);
    });
  }, [symbols.join(',')]);

  if (!symbols.length) return null;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Calendar size={16} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>
          Earnings Calendar
        </h3>
      </div>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-lo)' }}>Loading earnings dates...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map(e => (
            <div key={e.ticker} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 12px', borderRadius: 8,
              background: e.daysUntil != null && e.daysUntil <= 7
                ? 'rgba(255, 200, 100, 0.08)'
                : 'rgba(255,255,255,0.03)',
              border: e.daysUntil != null && e.daysUntil <= 7
                ? '1px solid rgba(255,200,100,0.2)'
                : '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-hi)', minWidth: 60 }}>
                {e.ticker}
              </span>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--text-lo)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.companyName}
              </span>
              {e.earningsDate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Clock size={11} style={{ color: 'var(--text-lo)' }} />
                  <span style={{ fontSize: 11, color: e.daysUntil != null && e.daysUntil <= 7 ? '#ffc864' : 'var(--text-lo)' }}>
                    {e.earningsDate}
                  </span>
                  {e.daysUntil != null && e.daysUntil >= 0 && (
                    <span style={{
                      fontSize: 10, padding: '1px 5px', borderRadius: 99,
                      background: e.daysUntil <= 7 ? 'rgba(255,200,100,0.2)' : 'rgba(255,255,255,0.08)',
                      color: e.daysUntil <= 7 ? '#ffc864' : 'var(--text-lo)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {e.daysUntil === 0 ? 'today' : `${e.daysUntil}d`}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-lo)', opacity: 0.4 }}>TBD</span>
              )}
              {e.epsEstimate != null && (
                <span style={{ fontSize: 10, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                  EPS est. ${e.epsEstimate.toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
