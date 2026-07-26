import { color, radius, space, tint } from '../tokens';
import { LIKERT_LABELS } from '../data/quizContent';

interface Props {
  value: number | undefined;
  onChange: (value: number) => void;
}

/**
 * 5-point Likert. Accent only on the selected option. Large hit areas, keyboard
 * accessible (radio group), labels at the extremes.
 */
export default function LikertScale({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Level of agreement">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: space.sm }}>
        {[1, 2, 3, 4, 5].map((v) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={LIKERT_LABELS[v - 1]}
              onClick={() => onChange(v)}
              style={{
                height: 56, borderRadius: radius.md, cursor: 'pointer',
                border: `1px solid ${selected ? color.accent : color.borderSub}`,
                background: selected ? tint(color.accent, 14) : color.surface,
                color: selected ? color.textHi : color.textMid,
                fontSize: 17, fontWeight: 700, transition: 'background .12s, border-color .12s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {v}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: space.sm, fontSize: 12, color: color.textLo }}>
        <span>{LIKERT_LABELS[0]}</span>
        <span>{LIKERT_LABELS[4]}</span>
      </div>
    </div>
  );
}
