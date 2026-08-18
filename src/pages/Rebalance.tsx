import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info, Scale } from 'lucide-react';
import { color, radius, space, tint, type as t } from '../features/synthetic-lab/tokens';
import { EngineError, EngineLoading } from '../features/synthetic-lab/components/TwinStates';
import { useTwin } from '../features/synthetic-lab/state/useTwin';
import { useLabDraft } from '../features/synthetic-lab/state/useLabDraft';
import { usePortfolioStore, getTotalValue } from '../store/portfolioStore';
import type { PortfolioHolding } from '../types';
import type { TwinAllocationRow } from '../services/syntheticPortfolioApi';

const money = (x: number) => x.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

// Real holdings carry a free-text `sector` (from Yahoo or an Open Finance
// import); the Twin's target carries a structured `asset_class`. Neither side
// speaks the other's vocabulary, so both are folded into one small shared
// taxonomy for comparison — a best-effort heuristic on the real-holdings side,
// disclosed in the UI rather than presented as exact.
type Bucket = 'Equity' | 'Real Estate' | 'Fixed Income' | 'Commodity' | 'Cash';
const BUCKETS: Bucket[] = ['Equity', 'Real Estate', 'Fixed Income', 'Commodity', 'Cash'];

function bucketFromTarget(row: TwinAllocationRow): Bucket {
  if (row.asset_class === 'cash') return 'Cash';
  if (row.asset_class === 'commodity') return 'Commodity';
  if (row.asset_class === 'fixed_income') return 'Fixed Income';
  if (row.sector === 'real_estate') return 'Real Estate';
  return 'Equity';
}

function bucketFromHolding(h: PortfolioHolding): Bucket {
  const s = h.sector.toLowerCase();
  if (h.symbol.toUpperCase() === 'CASH' || s === 'cash') return 'Cash';
  if (s.includes('fixed income') || s.includes('bond') || s.includes('treasury')) return 'Fixed Income';
  if (s.includes('real estate')) return 'Real Estate';
  if (s.includes('commodit') || s === 'gold' || s === 'oil') return 'Commodity';
  return 'Equity';
}

interface BucketRow {
  bucket: Bucket; currentWeight: number; targetWeight: number;
  currentValue: number; targetValue: number; deltaValue: number;
}

interface SymbolRow { symbol: string; name: string; currentValue: number; targetValue: number; deltaValue: number }

function useRebalanceData(holdings: PortfolioHolding[], allocation: TwinAllocationRow[]) {
  return useMemo(() => {
    const totalValue = getTotalValue(holdings);

    const currentByBucket = new Map<Bucket, number>();
    holdings.forEach((h) => {
      const b = bucketFromHolding(h);
      currentByBucket.set(b, (currentByBucket.get(b) ?? 0) + h.value);
    });
    const targetByBucket = new Map<Bucket, number>();
    allocation.forEach((a) => {
      const b = bucketFromTarget(a);
      targetByBucket.set(b, (targetByBucket.get(b) ?? 0) + a.weight);
    });
    const bucketRows: BucketRow[] = BUCKETS.map((bucket) => {
      const currentValue = currentByBucket.get(bucket) ?? 0;
      const currentWeight = totalValue > 0 ? currentValue / totalValue : 0;
      const targetWeight = targetByBucket.get(bucket) ?? 0;
      const targetValue = targetWeight * totalValue;
      return { bucket, currentWeight, targetWeight, currentValue, targetValue, deltaValue: targetValue - currentValue };
    }).filter((r) => r.currentWeight > 0.001 || r.targetWeight > 0.001);

    const targetBySymbol = new Map(allocation.filter((a) => a.symbol !== 'CASH').map((a) => [a.symbol.toUpperCase(), a]));
    const heldSymbols = new Set(holdings.map((h) => h.symbol.toUpperCase()));
    const targetSymbols = new Set(allocation.map((a) => a.symbol.toUpperCase()));

    const matched: SymbolRow[] = [];
    holdings.forEach((h) => {
      const target = targetBySymbol.get(h.symbol.toUpperCase());
      if (target) {
        const targetValue = target.weight * totalValue;
        matched.push({ symbol: h.symbol, name: h.name, currentValue: h.value, targetValue, deltaValue: targetValue - h.value });
      }
    });
    matched.sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue));

    const suggested: SymbolRow[] = allocation
      .filter((a) => a.symbol !== 'CASH' && a.weight > 0.005 && !heldSymbols.has(a.symbol.toUpperCase()))
      .map((a) => ({ symbol: a.symbol, name: a.name, currentValue: 0, targetValue: a.weight * totalValue, deltaValue: a.weight * totalValue }))
      .sort((a, b) => b.targetValue - a.targetValue);

    const unmodeled = holdings
      .filter((h) => !targetSymbols.has(h.symbol.toUpperCase()))
      .map((h) => ({ symbol: h.symbol, name: h.name, value: h.value }))
      .sort((a, b) => b.value - a.value);

    return { totalValue, bucketRows, matched, suggested, unmodeled };
  }, [holdings, allocation]);
}

function BucketBar({ row }: { row: BucketRow }) {
  const maxPct = Math.max(row.currentWeight, row.targetWeight, 0.01) * 100;
  const action = row.deltaValue > 1 ? 'increase' : row.deltaValue < -1 ? 'reduce' : 'on target';
  const actionColor = action === 'increase' ? color.positive : action === 'reduce' ? color.danger : color.textLo;
  return (
    <div style={{ padding: `${space.sm + 2}px 0`, borderBottom: `1px solid ${color.borderSub}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ color: color.textHi, fontSize: t.body, fontWeight: 700 }}>{row.bucket}</span>
        <span style={{ fontSize: t.support, color: actionColor, fontWeight: 600 }}>
          {action === 'on target' ? 'On target' : `${action === 'increase' ? 'Increase' : 'Reduce'} by ${money(Math.abs(row.deltaValue))}`}
        </span>
      </div>
      <div style={{ position: 'relative', height: 22 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: tint(color.textLo, 14) }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999,
          width: `${(row.currentWeight * 100 / maxPct) * 100}%`, background: color.accent, opacity: 0.55,
        }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
          transform: `translateX(${(row.targetWeight * 100 / maxPct) * 100}%)`, background: color.textHi,
        }} title={`Target: ${pct(row.targetWeight)}`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: t.support - 1, color: color.textLo }}>
        <span>Now: {pct(row.currentWeight)} ({money(row.currentValue)})</span>
        <span>Target: {pct(row.targetWeight)} ({money(row.targetValue)})</span>
      </div>
    </div>
  );
}

function SymbolTable({ title, rows, emptyLabel }: { title: string; rows: SymbolRow[]; emptyLabel: string }) {
  if (rows.length === 0) return null;
  return (
    <section style={{
      padding: space.lg, borderRadius: radius.lg,
      border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
    }}>
      <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700, marginBottom: space.sm }}>{title}</h3>
      <p style={{ color: color.textLo, fontSize: t.support - 1, marginBottom: space.md }}>{emptyLabel}</p>
      {rows.map((r) => (
        <div key={r.symbol} style={{
          display: 'grid', gridTemplateColumns: 'minmax(140px,1.4fr) auto auto auto', gap: space.md,
          alignItems: 'center', padding: `${space.sm}px 0`, borderBottom: `1px solid ${color.borderSub}`,
        }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ color: color.textHi, fontWeight: 700, fontSize: t.support + 1 }}>{r.symbol}</span>{' '}
            <span style={{ color: color.textLo, fontSize: t.support - 1 }}>{r.name}</span>
          </div>
          <span style={{ color: color.textMid, fontSize: t.support, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {money(r.currentValue)}
          </span>
          <ArrowRight size={13} aria-hidden style={{ color: color.textLo }} />
          <span style={{
            fontSize: t.support, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700,
            color: r.deltaValue > 1 ? color.positive : r.deltaValue < -1 ? color.danger : color.textMid,
          }}>
            {money(r.targetValue)}
          </span>
        </div>
      ))}
    </section>
  );
}

export default function Rebalance() {
  const { holdings } = usePortfolioStore();
  const draftApi = useLabDraft();
  const { data, loading, error, reload } = useTwin(draftApi.draft);

  const allocation = data?.portfolio.allocation ?? [];
  const { totalValue, bucketRows, matched, suggested, unmodeled } = useRebalanceData(holdings, allocation);

  const missingProfile = data?.twin.provenance.missing.filter((m) => ['goal', 'horizon', 'budget'].includes(m)) ?? [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: `${space.xl}px ${space.lg}px` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
        <Scale size={20} aria-hidden strokeWidth={1.75} style={{ color: color.accent }} />
        <span style={{ color: color.textLo, fontSize: t.support, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Your holdings vs. your Financial Twin's target
        </span>
      </div>
      <h1 style={{ fontSize: t.page, fontWeight: 700, letterSpacing: '-0.01em', color: color.textHi, margin: 0 }}>Rebalance</h1>
      <p style={{ fontSize: t.body, color: color.textMid, marginTop: space.sm, maxWidth: 640 }}>
        Compares the portfolio you actually hold against the diversified target the Financial Twin Lab
        would build for you, and shows what shifting toward it would mean in dollars.
      </p>

      {holdings.length === 0 ? (
        <div style={{
          marginTop: space.xl, padding: space.lg, borderRadius: radius.md,
          border: `1px solid ${color.borderSub}`, background: color.surface,
        }}>
          <p style={{ color: color.textMid, fontSize: t.body, marginBottom: space.md }}>
            Add holdings in Portfolio first — there's nothing to compare a target against yet.
          </p>
          <Link to="/portfolio" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, color: color.accent,
            fontSize: t.support + 1, fontWeight: 600, textDecoration: 'none',
          }}>
            Go to Portfolio <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          {loading && <div style={{ marginTop: space.xl }}><EngineLoading label="Building your target allocation…" /></div>}
          {error && !loading && (
            <div style={{ marginTop: space.xl }}>
              <EngineError message={error} endpoint="/api/synthetic-portfolio/twin" onRetry={reload} />
            </div>
          )}

          {data && !loading && !error && (
            <>
              {missingProfile.length > 0 && (
                <div style={{
                  display: 'flex', gap: space.sm, alignItems: 'flex-start', marginTop: space.xl,
                  padding: space.md, borderRadius: radius.md,
                  border: `1px solid ${color.borderSub}`, background: tint(color.warning, 6),
                }}>
                  <Info size={16} aria-hidden strokeWidth={1.75} style={{ color: color.warning, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: color.textMid, fontSize: t.support, margin: 0 }}>
                    This target uses defaults — {missingProfile.join(', ')} not answered yet.{' '}
                    <Link to="/synthetic-lab/profile" style={{ color: color.accent, fontWeight: 600 }}>
                      Complete your Financial Twin
                    </Link>{' '}
                    for a target based on your own goals.
                  </p>
                </div>
              )}

              <div style={{
                marginTop: space.xl, padding: space.md, borderRadius: radius.md,
                border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
              }}>
                <span style={{ color: color.textLo, fontSize: t.support - 1 }}>Comparing against a portfolio worth</span>{' '}
                <span style={{ color: color.textHi, fontSize: t.body, fontWeight: 700 }}>{money(totalValue)}</span>
              </div>

              <section style={{
                padding: space.lg, borderRadius: radius.lg,
                border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
              }}>
                <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700, marginBottom: space.sm }}>By asset class</h3>
                <p style={{ color: color.textLo, fontSize: t.support - 1, marginBottom: space.md }}>
                  Real holdings are bucketed from their sector text — a best-effort match, not an exact
                  classification. The white line marks the target weight.
                </p>
                {bucketRows.map((r) => <BucketBar key={r.bucket} row={r} />)}
              </section>

              <SymbolTable
                title="Matched positions"
                emptyLabel="Positions you hold that the target model also holds — current value moving toward target value."
                rows={matched}
              />
              <SymbolTable
                title="New positions the target suggests"
                emptyLabel="In the target but not in your current holdings at all."
                rows={suggested}
              />

              {unmodeled.length > 0 && (
                <section style={{
                  padding: space.lg, borderRadius: radius.lg,
                  border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
                }}>
                  <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700, marginBottom: space.sm }}>
                    Not part of the target model
                  </h3>
                  <p style={{ color: color.textLo, fontSize: t.support - 1, marginBottom: space.md }}>
                    Held in your real portfolio but outside the Twin's simulated universe — no buy/sell
                    verdict on these specifically, they're already counted in the asset-class view above.
                  </p>
                  {unmodeled.map((u) => (
                    <div key={u.symbol} style={{
                      display: 'flex', justifyContent: 'space-between', padding: `${space.sm}px 0`,
                      borderBottom: `1px solid ${color.borderSub}`, fontSize: t.support + 1,
                    }}>
                      <span><strong style={{ color: color.textHi }}>{u.symbol}</strong> <span style={{ color: color.textLo }}>{u.name}</span></span>
                      <span style={{ color: color.textMid, fontVariantNumeric: 'tabular-nums' }}>{money(u.value)}</span>
                    </div>
                  ))}
                </section>
              )}

              <p style={{ color: color.textLo, fontSize: t.support - 1 }}>{data.disclaimer} Not a trade instruction.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
