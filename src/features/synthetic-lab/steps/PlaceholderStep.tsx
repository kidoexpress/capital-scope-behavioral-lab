import { Construction } from 'lucide-react';
import { color, radius, space, tint, type as t } from '../tokens';
import { StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';

interface Props {
  title: string;
  description: string;
  /** Which upcoming build phase implements this step. */
  phase: string;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}

/**
 * Structural placeholder for steps implemented in later build phases.
 * Shows the real step header + navigation — NO fabricated data.
 */
export default function PlaceholderStep({ title, description, phase, onBack, onContinue, continueLabel = 'Continue' }: Props) {
  return (
    <div style={{ maxWidth: 760 }}>
      <StepHeading title={title} description={description} />
      <div style={{
        padding: space.lg, borderRadius: radius.md,
        border: `1px dashed ${color.borderSoft}`, background: tint(color.accent, 4),
        display: 'flex', alignItems: 'center', gap: space.md, color: color.textMid, fontSize: t.support + 1,
      }}>
        <Construction size={18} aria-hidden strokeWidth={1.75} style={{ color: color.accent, flexShrink: 0 }} />
        <span>This step is built in <strong>{phase}</strong>. The guided flow, navigation and saved progress already work.</span>
      </div>
      <StepFooter onBack={onBack} onContinue={onContinue} continueLabel={continueLabel} />
    </div>
  );
}
