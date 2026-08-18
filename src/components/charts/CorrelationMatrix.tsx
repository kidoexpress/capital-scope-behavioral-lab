import { useEffect, useState } from 'react';
import { calcCorrelation, getDailyReturns } from '../../utils/finance';
import { getStockHistory } from '../../utils/api';

interface CorrelationMatrixProps {
  symbols: string[];
  prices?: Record<string, number[]>;
}

// Same soft, desaturated family as the app's --red/--amber/--green/--accent
// design tokens (see index.css) instead of raw Tailwind rgba() values, so
// this reads as part of the product rather than a generic chart palette.
function getCorrelationColor(value: number): string {
  if (value >= 0.8) return 'rgba(236,111,134,0.55)';   // --red   · very high
  if (value >= 0.6) return 'rgba(236,111,134,0.32)';   // --red   · high
  if (value >= 0.4) return 'rgba(215,169,85,0.40)';    // --amber · moderate
  if (value >= 0.2) return 'rgba(85,217,154,0.30)';    // --green · low
  if (value >= 0) return 'rgba(85,217,154,0.14)';      // --green · near zero
  if (value >= -0.2) return 'rgba(138,164,255,0.18)';  // --accent · neutral-negative
  if (value >= -0.4) return 'rgba(138,164,255,0.34)';  // --accent · negative
  return 'rgba(168,150,255,0.5)';                       // --violet · very negative
}

function getCorrelationLabel(value: number): string {
  if (value >= 0.8) return 'Very High';
  if (value >= 0.6) return 'High';
  if (value >= 0.4) return 'Moderate';
  if (value >= 0.2) return 'Low';
  if (value >= -0.2) return 'Neutral';
  if (value >= -0.4) return 'Neg Low';
  return 'Neg High';
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 10) return 0;
  const ra = a.slice(-n).map((v, i) => (i > 0 ? (v - a[a.length - n + i - 1]) / a[a.length - n + i - 1] : 0)).slice(1);
  const rb = b.slice(-n).map((v, i) => (i > 0 ? (v - b[b.length - n + i - 1]) / b[b.length - n + i - 1] : 0)).slice(1);
  const ma = ra.reduce((s, v) => s + v, 0) / ra.length;
  const mb = rb.reduce((s, v) => s + v, 0) / rb.length;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < ra.length; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, num / denom));
}

const LEGEND = [
  { label: '> 0.8 Very High', color: 'rgba(236,111,134,0.55)' },
  { label: '0.4–0.8 Moderate', color: 'rgba(215,169,85,0.40)' },
  { label: '0–0.4 Low', color: 'rgba(85,217,154,0.30)' },
  { label: '< 0 Negative', color: 'rgba(138,164,255,0.34)' },
];

export default function CorrelationMatrix({ symbols, prices }: CorrelationMatrixProps) {
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<{ i: number; j: number } | null>(null);

  useEffect(() => {
    if (symbols.length < 2) { setLoading(false); return; }
    setLoading(true);

    // If caller pre-fetched real price history arrays, use them directly with Pearson.
    // Otherwise fall back to getStockHistory for backward compatibility.
    const hasRealHistory = symbols.every(sym => (prices?.[sym]?.length ?? 0) > 20);

    if (hasRealHistory && prices) {
      const n = symbols.length;
      const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          m[i][j] = i === j ? 1 : +pearson(prices[symbols[i]], prices[symbols[j]]).toFixed(3);
        }
      }
      setMatrix(m);
      setLoading(false);
    } else {
      Promise.all(symbols.map(sym =>
        getStockHistory(sym, '1Y').then(h => h.map(p => p.close))
      )).then(allPrices => {
        const returns = allPrices.map(getDailyReturns);
        const n = symbols.length;
        const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            m[i][j] = i === j ? 1 : +calcCorrelation(returns[i], returns[j]).toFixed(3);
          }
        }
        setMatrix(m);
        setLoading(false);
      });
    }
  }, [symbols.join(','), prices]);

  if (loading) return <div className="shimmer h-64 rounded-xl" />;
  if (symbols.length < 2) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 128, fontSize: 12, color: 'var(--text-lo)' }}>
      Add at least 2 holdings to see correlations
    </div>
  );

  const cellSize = Math.min(52, Math.max(34, Math.floor(420 / symbols.length)));
  const labelColWidth = 78;
  const fontSize = cellSize < 40 ? 9.5 : 11;

  return (
    <div style={{ overflow: 'auto' }}>
      <div style={{ display: 'inline-block', minWidth: '100%' }}>
        {/* Header row — 45° diagonal labels read long tickers (e.g. TD-SELIC-2029)
            far better than the previous fully-vertical writing-mode, which wrapped
            onto 2-3 lines and became illegible. */}
        <div style={{ display: 'flex', marginLeft: labelColWidth, height: 54, alignItems: 'flex-end' }}>
          {symbols.map(sym => (
            <div
              key={sym}
              style={{
                width: cellSize, flexShrink: 0, position: 'relative', height: 54,
              }}
            >
              <span style={{
                position: 'absolute', bottom: 6, left: '50%',
                transform: 'rotate(-40deg)', transformOrigin: 'left bottom',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
                color: 'var(--text-lo)', whiteSpace: 'nowrap',
              }}>
                {sym}
              </span>
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {symbols.map((rowSym, i) => (
          <div key={rowSym} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
            <div style={{
              width: labelColWidth, flexShrink: 0, textAlign: 'right', paddingRight: 8,
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 11,
              color: 'var(--text-lo)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={rowSym}>
              {rowSym}
            </div>
            {symbols.map((colSym, j) => {
              const val = matrix[i]?.[j] ?? 0;
              const isDiag = i === j;
              const isHovered = hovered?.i === i && hovered?.j === j;
              return (
                <div
                  key={colSym}
                  style={{
                    width: cellSize - 3, height: cellSize - 3, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, cursor: 'default',
                    background: getCorrelationColor(isDiag ? 1 : val),
                    border: isHovered ? '1px solid var(--border-strong)' : '1px solid transparent',
                    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 120ms ease, border-color 120ms ease',
                  }}
                  onMouseEnter={() => setHovered({ i, j })}
                  onMouseLeave={() => setHovered(null)}
                  title={isDiag ? `${rowSym} vs ${rowSym}: 1.00` : `${rowSym} vs ${colSym}: ${val.toFixed(2)} (${getCorrelationLabel(val)})`}
                >
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize,
                    color: isDiag || val >= 0.4 ? 'var(--text-hi)' : 'var(--text-mid)',
                  }}>
                    {isDiag ? '1.0' : val.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {LEGEND.map(l => (
            <div key={l.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: l.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--text-mid)' }}>
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
