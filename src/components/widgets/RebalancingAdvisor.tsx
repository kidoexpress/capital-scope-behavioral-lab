import { useState } from 'react';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';

interface Holding {
  symbol: string;
  currentWeight: number;  // 0–100
  currentValue: number;
}

interface Props {
  holdings: Holding[];
  totalValue: number;
}

interface RebalanceOrder {
  symbol: string;
  action: 'BUY' | 'SELL';
  dollarAmount: number;
  currentWeight: number;
  targetWeight: number;
}

export default function RebalancingAdvisor({ holdings, totalValue }: Props) {
  const [targets, setTargets] = useState<Record<string, number>>(
    Object.fromEntries(holdings.map(h => [h.symbol, Math.round(h.currentWeight * 10) / 10]))
  );
  const [show, setShow] = useState(false);

  const totalTarget = Object.values(targets).reduce((s, v) => s + v, 0);

  const orders: RebalanceOrder[] = holdings.map(h => {
    const target = targets[h.symbol] ?? h.currentWeight;
    const targetValue = (target / 100) * totalValue;
    const diff = targetValue - h.currentValue;
    return {
      symbol: h.symbol,
      action: diff >= 0 ? 'BUY' as const : 'SELL' as const,
      dollarAmount: Math.abs(diff),
      currentWeight: h.currentWeight,
      targetWeight: target,
    };
  }).filter(o => Math.abs(o.dollarAmount) > 10);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setShow(!show)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', margin: 0 }}>Rebalancing Advisor</h3>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-lo)' }}>{show ? '▲' : '▼'}</span>
      </div>
      {show && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text-lo)', marginBottom: 12 }}>
            Set target weights. Orders with less than $10 difference are ignored.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {holdings.map(h => (
              <div key={h.symbol} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-hi)', minWidth: 60 }}>
                  {h.symbol}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-lo)', minWidth: 50 }}>
                  {h.currentWeight.toFixed(1)}% now
                </span>
                <ArrowRight size={11} style={{ color: 'var(--text-lo)', flexShrink: 0 }} />
                <input
                  type="number"
                  value={targets[h.symbol] ?? h.currentWeight}
                  step={0.5}
                  min={0}
                  max={100}
                  onChange={e => setTargets(p => ({ ...p, [h.symbol]: Number(e.target.value) }))}
                  style={{ width: 70, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-lo)' }}>%</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: Math.abs(totalTarget - 100) > 0.1 ? '#ffc864' : '#55d99a', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            Total: {totalTarget.toFixed(1)}% {Math.abs(totalTarget - 100) > 0.1 ? '⚠️ must equal 100%' : '✓'}
          </p>
          {orders.length > 0 ? (
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-lo)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Required Orders
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {orders.map(o => (
                  <div key={o.symbol} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8,
                    background: o.action === 'BUY' ? 'rgba(85,217,154,0.08)' : 'rgba(255,107,107,0.08)',
                    border: `1px solid ${o.action === 'BUY' ? 'rgba(85,217,154,0.2)' : 'rgba(255,107,107,0.2)'}`,
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: o.action === 'BUY' ? 'rgba(85,217,154,0.2)' : 'rgba(255,107,107,0.2)',
                      color: o.action === 'BUY' ? '#55d99a' : '#ff6b6b',
                    }}>{o.action}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-hi)' }}>{o.symbol}</span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace' }}>
                      ${o.dollarAmount.toFixed(0)}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-lo)' }}>
                      {o.currentWeight.toFixed(1)}% → {o.targetWeight.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#55d99a' }}>✓ Portfolio is within tolerance of targets.</p>
          )}
          <p style={{ fontSize: 10, color: 'var(--text-lo)', marginTop: 12 }}>
            These are paper trading suggestions. Always consult a financial advisor before executing real trades.
          </p>
        </div>
      )}
    </div>
  );
}
