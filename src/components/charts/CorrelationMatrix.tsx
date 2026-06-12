import { useEffect, useState } from 'react';

interface CorrelationMatrixProps {
  symbols: string[];
  prices?: Record<string, number[]>;
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 10) return 0;
  const ra = a.slice(-n).map((v, i) => i > 0 ? (v - a[a.length - n + i - 1]) / a[a.length - n + i - 1] : 0).slice(1);
  const rb = b.slice(-n).map((v, i) => i > 0 ? (v - b[b.length - n + i - 1]) / b[b.length - n + i - 1] : 0).slice(1);
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

function getCorrelationColor(value: number): string {
  if (value >= 0.8) return 'rgba(239,68,68,0.85)';
  if (value >= 0.6) return 'rgba(249,115,22,0.75)';
  if (value >= 0.4) return 'rgba(245,158,11,0.65)';
  if (value >= 0.2) return 'rgba(16,185,129,0.45)';
  if (value >= 0) return 'rgba(16,185,129,0.25)';
  if (value >= -0.2) return 'rgba(59,130,246,0.25)';
  if (value >= -0.4) return 'rgba(59,130,246,0.45)';
  return 'rgba(99,102,241,0.65)';
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

export default function CorrelationMatrix({ symbols, prices }: CorrelationMatrixProps) {
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<{ i: number; j: number } | null>(null);

  useEffect(() => {
    if (symbols.length < 2) { setLoading(false); return; }
    setLoading(true);

    const n = symbols.length;
    const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) { m[i][j] = 1; continue; }
        const a = prices?.[symbols[i]];
        const b = prices?.[symbols[j]];
        m[i][j] = a && b && a.length >= 10 && b.length >= 10
          ? +pearson(a, b).toFixed(3)
          : 0;
      }
    }
    setMatrix(m);
    setLoading(false);
  }, [symbols.join(',')]);

  if (loading) return <div className="shimmer h-64 rounded-xl" />;
  if (symbols.length < 2) return (
    <div className="flex items-center justify-center h-32 text-xs" style={{ color: '#334155' }}>
      Add at least 2 holdings to see correlations
    </div>
  );

  const cellSize = Math.min(56, Math.floor(400 / symbols.length));
  const fontSize = cellSize < 40 ? 8 : 10;

  return (
    <div className="overflow-auto">
      <div className="inline-block min-w-full">
        {/* Header row */}
        <div className="flex" style={{ marginLeft: cellSize + 4 }}>
          {symbols.map(sym => (
            <div key={sym} className="flex items-end justify-center font-mono text-[9px] font-semibold shrink-0" style={{ width: cellSize, height: 32, color: '#64748b', writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center' }}>
              {sym}
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {symbols.map((rowSym, i) => (
          <div key={rowSym} className="flex items-center gap-1 mb-1">
            <div className="font-mono font-semibold text-right shrink-0" style={{ width: cellSize, fontSize: fontSize, color: '#64748b' }}>
              {rowSym}
            </div>
            {symbols.map((colSym, j) => {
              const val = matrix[i]?.[j] ?? 0;
              const isDiag = i === j;
              const isHovered = hovered?.i === i && hovered?.j === j;
              return (
                <div
                  key={colSym}
                  className="flex items-center justify-center rounded-md cursor-default transition-all duration-150 shrink-0"
                  style={{
                    width: cellSize - 2,
                    height: cellSize - 2,
                    background: isDiag
                      ? 'rgba(99,102,241,0.2)'
                      : getCorrelationColor(val),
                    border: isHovered ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onMouseEnter={() => setHovered({ i, j })}
                  onMouseLeave={() => setHovered(null)}
                  title={isDiag ? `${rowSym} vs ${rowSym}: 1.00` : `${rowSym} vs ${colSym}: ${val.toFixed(2)} (${getCorrelationLabel(val)})`}
                >
                  <span className="font-mono font-bold" style={{ fontSize: fontSize, color: isDiag ? '#a5b4fc' : val > 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)' }}>
                    {isDiag ? '1.0' : val.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[9px]" style={{ color: '#334155' }}>Correlation:</span>
          {[
            { label: '> 0.8 Very High', color: 'rgba(239,68,68,0.85)' },
            { label: '0.4–0.8 Moderate', color: 'rgba(245,158,11,0.65)' },
            { label: '0–0.4 Low', color: 'rgba(16,185,129,0.35)' },
            { label: '< 0 Negative', color: 'rgba(59,130,246,0.45)' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: l.color }} />
              <span className="text-[9px] font-mono" style={{ color: '#475569' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
