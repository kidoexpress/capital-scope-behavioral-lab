import { Info } from 'lucide-react';
import { color, radius, space, tint, type as t } from '../tokens';
import { StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';
import { EngineError, EngineLoading } from '../components/TwinStates';
import { useTwin } from '../state/useTwin';
import type { LabDraft } from '../state/useLabDraft';
import type { TwinAllocationRow } from '../../../services/syntheticPortfolioApi';

interface Props {
  draft: LabDraft;
  onBack?: () => void;
  onContinue?: () => void;
}

const CLASS_LABEL: Record<string, string> = {
  equity: 'Equity',
  etf: 'ETF',
  fixed_income: 'Fixed income',
  commodity: 'Commodity',
  cash: 'Cash',
};

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

function AllocationRow({ row, max }: { row: TwinAllocationRow; max: number }) {
  const wPct = max > 0 ? (row.weight / max) * 100 : 0;
  const rPct = max > 0 ? (row.risk_contribution / max) * 100 : 0;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'minmax(96px, 1.1fr) 2fr minmax(64px, auto) minmax(64px, auto)',
      gap: space.md, alignItems: 'center', padding: `${space.sm + 2}px 0`,
      borderBottom: `1px solid ${color.borderSub}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: color.textHi, fontSize: t.support + 1, fontWeight: 700 }}>{row.symbol}</div>
        <div style={{ color: color.textLo, fontSize: t.support - 1 }}>
          {CLASS_LABEL[row.asset_class] ?? row.asset_class}
        </div>
      </div>

      {/* Two bars on one track: how big the position is, and how much risk it carries. */}
      <div style={{ display: 'grid', gap: 3 }}>
        <div style={{ height: 8, borderRadius: 999, background: tint(color.textLo, 16), overflow: 'hidden' }}>
          <div style={{ width: `${wPct}%`, height: '100%', background: color.accent, borderRadius: 999 }} />
        </div>
        <div style={{ height: 8, borderRadius: 999, background: tint(color.textLo, 16), overflow: 'hidden' }}>
          <div style={{ width: `${rPct}%`, height: '100%', background: tint(color.warning, 70), borderRadius: 999 }} />
        </div>
      </div>

      <div style={{ color: color.textHi, fontSize: t.support + 1, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct(row.weight)}
      </div>
      <div style={{ color: color.textMid, fontSize: t.support + 1, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct(row.risk_contribution)}
      </div>
    </div>
  );
}

export default function PortfolioStep({ draft, onBack, onContinue }: Props) {
  const { data, loading, error, reload } = useTwin(draft);

  return (
    <div style={{ maxWidth: 900 }}>
      <StepHeading
        title="Your portfolio"
        description="Built from your twin's limits, sized so no single position quietly dominates the risk."
      />

      {loading && <EngineLoading label="Constructing and stress-testing your portfolio…" />}
      {error && !loading && <EngineError message={error} onRetry={reload} />}

      {data && !loading && !error && (() => {
        const { allocation, risk, metrics, constraint_violations: violations } = data.portfolio;
        const rows = allocation.filter((r) => r.weight > 0.0005);
        const max = Math.max(...rows.map((r) => Math.max(r.weight, r.risk_contribution)), 0.0001);

        const byClass = rows.reduce<Record<string, number>>((acc, r) => {
          acc[r.asset_class] = (acc[r.asset_class] ?? 0) + r.weight;
          return acc;
        }, {});

        const headline = [
          { label: 'Expected volatility', value: pct(risk.portfolio_volatility), hint: 'annualized' },
          { label: 'Diversification ratio', value: risk.diversification_ratio.toFixed(2), hint: '1.00 = no benefit' },
          { label: 'Max drawdown', value: pct(Math.abs(metrics.max_drawdown ?? 0)), hint: 'worst peak-to-trough' },
          { label: 'Positions', value: String(rows.length), hint: 'after constraints' },
        ];

        return (
          <>
            <div style={{
              display: 'grid', gap: space.md, marginBottom: space.lg,
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            }}>
              {headline.map((m) => (
                <div key={m.label} style={{
                  padding: space.md, borderRadius: radius.md,
                  border: `1px solid ${color.borderSub}`, background: color.surface,
                }}>
                  <div style={{ color: color.textLo, fontSize: t.support - 1, marginBottom: 6 }}>{m.label}</div>
                  <div style={{ color: color.textHi, fontSize: t.section, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {m.value}
                  </div>
                  <div style={{ color: color.textLo, fontSize: t.support - 1, marginTop: 2 }}>{m.hint}</div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg,
            }}>
              {Object.entries(byClass).sort((a, b) => b[1] - a[1]).map(([klass, w]) => (
                <span key={klass} style={{
                  padding: '5px 11px', borderRadius: 999, fontSize: t.support - 1,
                  border: `1px solid ${color.borderSub}`, background: color.raised, color: color.textMid,
                }}>
                  {CLASS_LABEL[klass] ?? klass} <strong style={{ color: color.textHi }}>{pct(w, 0)}</strong>
                </span>
              ))}
            </div>

            <section style={{
              padding: space.lg, borderRadius: radius.lg,
              border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
            }}>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: space.md,
                alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.sm,
              }}>
                <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700 }}>Allocation</h3>
                <div style={{ display: 'flex', gap: space.md, fontSize: t.support - 1, color: color.textLo }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 8, borderRadius: 999, background: color.accent }} /> weight
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 8, borderRadius: 999, background: tint(color.warning, 70) }} /> risk share
                  </span>
                </div>
              </div>
              <p style={{ color: color.textLo, fontSize: t.support - 1, marginBottom: space.md }}>
                A position can be small and still carry a large share of the risk. The two bars diverge
                whenever that happens.
              </p>
              {rows.map((r) => <AllocationRow key={r.asset_id} row={r} max={max} />)}
            </section>

            <div style={{
              display: 'flex', gap: space.md, padding: space.md, borderRadius: radius.md,
              border: `1px solid ${color.borderSub}`, background: tint(color.accent, 5), marginBottom: space.md,
            }}>
              <Info size={16} aria-hidden strokeWidth={1.75} style={{ color: color.accent, flexShrink: 0, marginTop: 2 }} />
              <div style={{ color: color.textMid, fontSize: t.support - 1, lineHeight: 1.55 }}>
                Sizing uses a covariance matrix estimated from {risk.covariance.observations} days of simulated
                history{risk.covariance.average_correlation !== undefined
                  ? ` (average correlation ${risk.covariance.average_correlation.toFixed(2)})` : ''}, shrunk toward a
                constant-correlation target to keep the estimate stable.
                {violations.length > 0 && (
                  <> Constraints still breached: <strong>{violations.join(', ')}</strong>.</>
                )}
                <div style={{ marginTop: 4, color: color.textLo }}>{data.disclaimer}</div>
              </div>
            </div>
          </>
        );
      })()}

      <StepFooter onBack={onBack} onContinue={onContinue} continueLabel="See the forecast" />
    </div>
  );
}
