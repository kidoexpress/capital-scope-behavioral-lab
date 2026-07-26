import { Construction } from 'lucide-react';
import { color, radius, space, tint, type as t } from '../tokens';

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
      <h2 style={{ fontSize: t.section, fontWeight: 700, color: color.textHi, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: t.body, color: color.textMid, marginTop: space.sm, maxWidth: 620 }}>{description}</p>

      <div style={{
        marginTop: space.lg, padding: space.lg, borderRadius: radius.md,
        border: `1px dashed ${color.borderSoft}`, background: tint(color.accent, 4),
        display: 'flex', alignItems: 'center', gap: space.md, color: color.textMid, fontSize: t.support + 1,
      }}>
        <Construction size={18} aria-hidden style={{ color: color.accent, flexShrink: 0 }} />
        <span>This step is built in <strong>{phase}</strong>. The guided flow, navigation and saved progress already work.</span>
      </div>

      <div style={{ display: 'flex', gap: space.sm, marginTop: space.xl }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{
            height: 44, padding: '0 20px', borderRadius: radius.md, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${color.borderSoft}`, color: color.textMid, fontSize: t.body, fontWeight: 600,
          }}>Back</button>
        )}
        {onContinue && (
          <button type="button" onClick={onContinue} style={{
            height: 44, padding: '0 22px', borderRadius: radius.md, border: 'none', cursor: 'pointer',
            background: color.accent, color: '#fff', fontSize: t.body, fontWeight: 700,
          }}>{continueLabel}</button>
        )}
      </div>
    </div>
  );
}
