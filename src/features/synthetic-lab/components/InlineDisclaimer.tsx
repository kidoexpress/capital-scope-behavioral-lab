import { Info } from 'lucide-react';
import { color, radius, space, tint } from '../tokens';

interface Props {
  onHowItWorks?: () => void;
}

/** Short disclaimer — never a long paragraph under the title. */
export default function InlineDisclaimer({ onHowItWorks }: Props) {
  return (
    <div
      role="note"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: space.sm,
        padding: `${space.xs}px ${space.sm + 2}px`, borderRadius: radius.sm,
        background: tint(color.warning, 8), border: `1px solid ${tint(color.warning, 28)}`,
        fontSize: 12, color: color.textMid,
      }}
    >
      <Info size={13} aria-hidden style={{ color: color.warning, flexShrink: 0 }} />
      <span>Simulated results, not guaranteed returns.</span>
      {onHowItWorks && (
        <button
          type="button"
          onClick={onHowItWorks}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: color.accent, fontSize: 12, fontWeight: 600, textDecoration: 'underline',
          }}
        >
          How this works
        </button>
      )}
    </div>
  );
}
