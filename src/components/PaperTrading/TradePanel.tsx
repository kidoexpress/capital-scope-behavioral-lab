import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronDown, Loader2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Portfolio, TradeRequest } from '../../types/portfolio';
import { formatCurrency } from '../../utils/finance';

interface Props {
  portfolio: Portfolio | null;
  onTrade: (trade: TradeRequest) => Promise<void>;
  loading?: boolean;
}

const SPRING = { type: 'spring', stiffness: 460, damping: 34, mass: 0.6 } as const;
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function TradePanel({ portfolio, onTrade, loading }: Props) {
  const reduce = useReducedMotion();
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [ticker, setTicker] = useState('AAPL');
  const [shares, setShares] = useState(1);

  const symbol = ticker.toUpperCase();
  const holding = useMemo(
    () => portfolio?.holdings.find((h) => h.ticker === symbol) ?? null,
    [portfolio, symbol],
  );
  const previewPrice = holding?.currentPrice ?? 0;
  const estimated = previewPrice * shares;
  const isBuy = action === 'buy';
  const accent = isBuy ? 'var(--green)' : 'var(--red)';
  const cash = portfolio?.cash ?? 0;
  const heldShares = holding?.shares ?? 0;

  const insufficient = isBuy
    ? previewPrice > 0 && estimated > cash
    : shares > heldShares && heldShares >= 0 && shares > 0 && holding !== null;

  const disabled = !portfolio || !!loading || !symbol || shares <= 0;

  const submit = async () => {
    await onTrade({ action, ticker: symbol, shares });
  };

  const label =
    shares <= 0
      ? 'Enter quantity'
      : insufficient
        ? isBuy ? 'Insufficient cash' : `Only ${heldShares} sh held`
        : `Confirm ${isBuy ? 'Buy' : 'Sell'} ${symbol || ''}`.trim();

  const card: CSSProperties = {
    borderRadius: 20,
    border: '1px solid var(--border-soft)',
    background: 'var(--bg-raised)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };
  const inner: CSSProperties = {
    borderRadius: 14,
    border: '1px solid var(--border-sub)',
    background: 'var(--bg-surface)',
    padding: 14,
  };
  const rowBetween: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const muted: CSSProperties = { fontSize: 11, color: 'var(--text-lo)' };

  return (
    <aside className="paper-trade-panel" style={card}>
      {/* header */}
      <div style={rowBetween}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>
            Trade Panel
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 2, color: 'var(--text-hi)' }}>Virtual Order</h2>
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 99,
            color: accent, background: tint(accent, 12), border: `1px solid ${tint(accent, 40)}`,
          }}
        >
          {isBuy ? 'BUY' : 'SELL'}
        </span>
      </div>

      {/* buy / sell segmented toggle */}
      <div
        style={{
          position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          padding: 4, borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border-sub)',
        }}
      >
        {(['buy', 'sell'] as const).map((a) => {
          const active = action === a;
          const c = a === 'buy' ? 'var(--green)' : 'var(--red)';
          const Icon = a === 'buy' ? ArrowUpRight : ArrowDownRight;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAction(a)}
              style={{
                position: 'relative', height: 38, borderRadius: 10, border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: active ? c : 'var(--text-lo)',
              }}
            >
              {active && (
                <motion.div
                  layoutId="ptActionPill"
                  transition={reduce ? { duration: 0 } : SPRING}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 10,
                    background: tint(c, 15), border: `1px solid ${tint(c, 45)}`,
                  }}
                />
              )}
              <Icon size={15} style={{ position: 'relative', zIndex: 1 }} />
              <span style={{ position: 'relative', zIndex: 1 }}>{a === 'buy' ? 'Buy' : 'Sell'}</span>
            </button>
          );
        })}
      </div>

      {/* quantity field + ticker pill */}
      <div style={inner}>
        <div style={rowBetween}>
          <span style={muted}>{isBuy ? 'You buy' : 'You sell'}</span>
          <span style={muted}>
            {isBuy ? `Cash ${formatCurrency(cash)}` : `Holding ${heldShares} sh`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <input
            type="number"
            min={0.0001}
            step={0.01}
            value={shares}
            onChange={(e) => setShares(Number(e.target.value))}
            style={{
              minWidth: 0, flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-hi)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            placeholder="0"
          />
          <label
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, cursor: 'text',
              padding: '7px 10px', borderRadius: 99, border: '1px solid var(--border-soft)',
              background: 'var(--bg-raised)',
            }}
          >
            <span
              style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800,
                color: 'var(--bg-base)', background: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {(symbol.slice(0, 2) || '—')}
            </span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              style={{
                width: `${Math.max(4, symbol.length || 4)}ch`, background: 'transparent', border: 'none',
                outline: 'none', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)', textTransform: 'uppercase',
              }}
            />
            <ChevronDown size={14} style={{ color: 'var(--text-lo)' }} />
          </label>
        </div>
        <div style={{ ...muted, marginTop: 8 }}>
          {previewPrice ? `@ ${formatCurrency(previewPrice)} / share` : 'Live quote on submit'}
        </div>
      </div>

      {/* order summary */}
      <div style={{ ...inner, background: tint(accent, 6), borderColor: tint(accent, 22) }}>
        <div style={rowBetween}>
          <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>
            Estimated {isBuy ? 'cost' : 'proceeds'}
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.strong
              key={previewPrice ? estimated.toFixed(2) : 'na'}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-hi)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {previewPrice ? formatCurrency(estimated) : '—'}
            </motion.strong>
          </AnimatePresence>
        </div>
        <div style={{ ...rowBetween, marginTop: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--text-lo)' }}>Market price</span>
          <span style={{ color: 'var(--text-mid)' }}>{previewPrice ? formatCurrency(previewPrice) : 'on submit'}</span>
        </div>
        <div style={{ ...rowBetween, marginTop: 6, fontSize: 12 }}>
          <span style={{ color: 'var(--text-lo)' }}>Shares</span>
          <span style={{ color: 'var(--text-mid)', fontFamily: 'JetBrains Mono, monospace' }}>{shares}</span>
        </div>
        <p style={{ ...muted, marginTop: 10, lineHeight: 1.5 }}>
          Trades execute against Yahoo Finance latest available price. Educational simulation only.
        </p>
      </div>

      {/* action */}
      <motion.button
        type="button"
        whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
        disabled={disabled}
        onClick={submit}
        style={{
          height: 48, borderRadius: 14, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 14, fontWeight: 700,
          background: disabled ? 'var(--bg-surface)' : accent,
          color: disabled ? 'var(--text-lo)' : isBuy ? '#05130b' : '#ffffff',
          opacity: disabled ? 0.7 : 1,
          boxShadow: disabled ? 'none' : `0 8px 24px ${tint(accent, 30)}`,
        }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {label}
      </motion.button>
    </aside>
  );
}
