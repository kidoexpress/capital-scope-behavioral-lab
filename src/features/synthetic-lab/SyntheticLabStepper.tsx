import { Check } from 'lucide-react';
import { color, radius, space, tint } from './tokens';
import { STEPPER_STEPS, stepIndex, type StepId } from './config/steps';

interface Props {
  currentStep: StepId;
  /** Highest step index the user has reached (for enabling back-navigation). */
  maxReachedIndex: number;
  onNavigate: (step: StepId) => void;
}

/**
 * Persistent progress stepper: Profile → Behavior → Scenarios → Your Twin →
 * Portfolio → Forecast. Current = accent, done = check, future = muted.
 * Visited steps are keyboard/click navigable. Reduced to "Step x of n" on mobile.
 */
export default function SyntheticLabStepper({ currentStep, maxReachedIndex, onNavigate }: Props) {
  const currentIdx = stepIndex(currentStep);
  const stepperCurrent = STEPPER_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Progress" style={{ width: '100%' }}>
      {/* Desktop / tablet: full stepper */}
      <ol
        className="stlab-stepper-full"
        style={{ display: 'flex', alignItems: 'center', gap: space.xs, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}
      >
        {STEPPER_STEPS.map((s, i) => {
          const idx = stepIndex(s.id);
          const done = idx < currentIdx;
          const active = s.id === currentStep;
          const reachable = idx <= maxReachedIndex;
          const dot = active ? color.accent : done ? color.positive : color.textLo;
          return (
            <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
              <button
                type="button"
                onClick={() => reachable && onNavigate(s.id)}
                disabled={!reachable}
                aria-current={active ? 'step' : undefined}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px',
                  borderRadius: radius.md, border: `1px solid ${active ? color.accent : 'transparent'}`,
                  background: active ? tint(color.accent, 12) : 'transparent',
                  color: active ? color.accent : done ? color.textMid : color.textLo,
                  cursor: reachable ? 'pointer' : 'default', fontSize: 13, fontWeight: active ? 700 : 500,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 700,
                    border: `1.5px solid ${dot}`, color: done ? color.base : dot,
                    background: done ? color.positive : 'transparent',
                  }}
                >
                  {done ? <Check size={12} /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < STEPPER_STEPS.length - 1 && (
                <span aria-hidden style={{ width: 14, height: 1, background: color.borderSoft }} />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact */}
      <div
        className="stlab-stepper-compact"
        style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: color.accent }}>
          {STEPPER_STEPS[Math.max(0, stepperCurrent)]?.label}
        </span>
        <span style={{ fontSize: 12, color: color.textLo }}>
          Step {Math.max(1, stepperCurrent + 1)} of {STEPPER_STEPS.length}
        </span>
      </div>
    </nav>
  );
}
