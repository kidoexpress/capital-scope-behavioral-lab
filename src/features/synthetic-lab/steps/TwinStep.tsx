import { Info } from 'lucide-react';
import { color, radius, space, tint, type as t } from '../tokens';
import { StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';
import { EngineError, EngineLoading } from '../components/TwinStates';
import { useTwin } from '../state/useTwin';
import type { LabDraft } from '../state/useLabDraft';

interface Props {
  draft: LabDraft;
  onBack?: () => void;
  onContinue?: () => void;
}

/** Traits worth showing, in the order that reads as a profile. */
const TRAIT_ROWS: { key: string; label: string; hint: string }[] = [
  { key: 'risk_tolerance', label: 'Risk tolerance', hint: 'How much variability you accept in pursuit of return' },
  { key: 'loss_aversion', label: 'Loss aversion', hint: 'How much more a loss weighs than an equivalent gain' },
  { key: 'trend_sensitivity', label: 'Trend sensitivity', hint: 'How strongly recent moves pull your decisions' },
  { key: 'herding', label: 'Herding', hint: 'How much others buying influences you' },
  { key: 'overconfidence', label: 'Overconfidence', hint: 'How much you trust your own read of opportunities' },
  { key: 'ambiguity_aversion', label: 'Ambiguity aversion', hint: 'How much unexplained uncertainty puts you off' },
  { key: 'need_for_control', label: 'Need for control', hint: 'How much you want the final say over changes' },
  { key: 'ai_trust', label: 'Trust in automation', hint: 'How willing you are to follow a system suggestion' },
];

const OBJECTIVE_LABEL: Record<string, string> = {
  capital_preservation: 'Capital preservation',
  income_generation: 'Income generation',
  balanced_growth: 'Balanced growth',
  aggressive_growth: 'Aggressive growth',
  long_term_growth: 'Long-term growth',
};

function TraitBar({ label, hint, value }: { label: string; hint: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: space.md }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm }}>
        <span style={{ color: color.textHi, fontSize: t.support + 1, fontWeight: 600 }}>{label}</span>
        <span style={{ color: color.textMid, fontSize: t.support, fontVariantNumeric: 'tabular-nums' }}>{pct}</span>
      </div>
      <div
        role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}
        style={{
          height: 6, borderRadius: 999, background: tint(color.textLo, 18),
          margin: `${space.xs}px 0 3px`, overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color.accent }} />
      </div>
      <span style={{ color: color.textLo, fontSize: t.support - 1 }}>{hint}</span>
    </div>
  );
}

export default function TwinStep({ draft, onBack, onContinue }: Props) {
  const { data, loading, error, reload } = useTwin(draft);

  return (
    <div style={{ maxWidth: 860 }}>
      <StepHeading
        title="Your Financial Twin"
        description="A behavioural profile derived from your own answers — and the portfolio limits that follow from it."
      />

      {loading && <EngineLoading label="Deriving your twin from your answers…" />}
      {error && !loading && <EngineError message={error} onRetry={reload} />}

      {data && !loading && !error && (() => {
        const { behavioral_traits: traits, constraints, objectives, provenance } = data.twin;
        const answered = provenance.answered;
        const limits = [
          { label: 'Maximum in equities', value: `${Math.round(constraints.maximum_equity_weight * 100)}%`,
            why: 'follows from your risk tolerance' },
          { label: 'Minimum in cash', value: `${Math.round(constraints.minimum_cash_weight * 100)}%`,
            why: 'follows from your liquidity needs and loss aversion' },
          { label: 'Cap per single asset', value: `${Math.round(constraints.maximum_single_asset_weight * 100)}%`,
            why: 'follows from your stated experience' },
          { label: 'Drawdown you tolerate', value: `${Math.round(constraints.maximum_expected_drawdown * 100)}%`,
            why: 'follows from loss aversion, risk tolerance and horizon' },
        ];

        return (
          <>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: space.sm, alignItems: 'center',
              marginBottom: space.lg, color: color.textMid, fontSize: t.support,
            }}>
              <span style={{
                padding: '4px 10px', borderRadius: 999, background: tint(color.accent, 12),
                border: `1px solid ${tint(color.accent, 30)}`, color: color.textHi, fontWeight: 600,
              }}>
                {OBJECTIVE_LABEL[objectives.primary] ?? objectives.primary}
              </span>
              <span>
                built from {answered.profile} profile answers, {answered.quiz} quiz items
                and {answered.scenarios} scenario {answered.scenarios === 1 ? 'decision' : 'decisions'}
              </span>
            </div>

            <div style={{
              display: 'grid', gap: space.lg,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: space.lg,
            }}>
              <section style={{
                padding: space.lg, borderRadius: radius.lg,
                border: `1px solid ${color.borderSub}`, background: color.surface,
              }}>
                <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700, marginBottom: space.md }}>
                  How you decide
                </h3>
                {TRAIT_ROWS.filter((r) => r.key in traits).map((r) => (
                  <TraitBar key={r.key} label={r.label} hint={r.hint} value={traits[r.key]} />
                ))}
              </section>

              <section style={{
                padding: space.lg, borderRadius: radius.lg,
                border: `1px solid ${color.borderSub}`, background: color.surface,
              }}>
                <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700, marginBottom: space.md }}>
                  What that means for your portfolio
                </h3>
                {limits.map((l) => (
                  <div key={l.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    gap: space.md, padding: `${space.sm + 2}px 0`,
                    borderBottom: `1px solid ${color.borderSub}`,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: color.textHi, fontSize: t.support + 1, fontWeight: 600 }}>{l.label}</div>
                      <div style={{ color: color.textLo, fontSize: t.support - 1 }}>{l.why}</div>
                    </div>
                    <div style={{
                      color: color.accent, fontSize: t.card, fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                    }}>
                      {l.value}
                    </div>
                  </div>
                ))}
                <p style={{ color: color.textLo, fontSize: t.support - 1, marginTop: space.md }}>
                  These are hard limits the optimizer must respect — not suggestions.
                </p>
              </section>
            </div>

            {(provenance.missing.length > 0 || provenance.notes.length > 0) && (
              <div style={{
                display: 'flex', gap: space.md, padding: space.md,
                borderRadius: radius.md, border: `1px solid ${color.borderSub}`,
                background: tint(color.warning, 6), marginBottom: space.md,
              }}>
                <Info size={16} aria-hidden strokeWidth={1.75}
                  style={{ color: color.warning, flexShrink: 0, marginTop: 2 }} />
                <div style={{ color: color.textMid, fontSize: t.support - 1 }}>
                  {provenance.missing.length > 0 && (
                    <div>
                      Unanswered items defaulted to neutral: {provenance.missing.join(', ')}.
                    </div>
                  )}
                  {provenance.notes.map((n) => <div key={n}>{n}</div>)}
                </div>
              </div>
            )}
          </>
        );
      })()}

      <StepFooter onBack={onBack} onContinue={onContinue} continueLabel="Build my portfolio" />
    </div>
  );
}
