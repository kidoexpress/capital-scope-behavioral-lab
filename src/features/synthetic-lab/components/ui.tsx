import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { color, radius, space, tint, type as t } from '../tokens';

/**
 * Shared UI primitives that mirror the rest of the site's design system:
 * - primary action = white pill (rgba(255,255,255,0.92) on near-black text)
 * - accent (#8aa4ff) is reserved for selected / current / key highlight
 * - surfaces are subtle (low-alpha white), borders discreet, radius ~16–20
 */

type Variant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  leftIcon?: ReactNode;
}

export function Button({ variant = 'primary', leftIcon, children, style, disabled, ...rest }: ButtonProps) {
  const base: CSSProperties = {
    height: 46, padding: '0 22px', borderRadius: 999, fontSize: t.body, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity .15s ease, background .15s ease',
  };
  const variants: Record<Variant, CSSProperties> = {
    primary: { background: 'rgba(255,255,255,0.92)', color: '#080a0f', boxShadow: '0 14px 34px rgba(255,255,255,0.06)' },
    ghost: { background: 'transparent', color: color.textMid, border: `1px solid ${color.borderSoft}`, fontWeight: 600 },
  };
  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...(disabled ? { opacity: 0.42 } : {}), ...style }}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
}

/** Subtle card surface matching `.workflow-card` (low-alpha white, discreet border). */
export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      style={{
        background: color.surface, border: `1px solid ${color.borderSub}`,
        borderRadius: 20, padding: space.lg, ...style,
      }}
    >
      {children}
    </section>
  );
}

/** Selectable option card. Accent appears ONLY when selected. */
export function SelectCard({
  selected, onClick, children, ariaLabel, style,
}: {
  selected: boolean; onClick: () => void; children: ReactNode; ariaLabel?: string; style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      style={{
        textAlign: 'left', width: '100%', padding: `${space.md - 2}px ${space.md}px`, borderRadius: radius.md,
        cursor: 'pointer', fontSize: t.body, transition: 'background .12s, border-color .12s',
        border: `1px solid ${selected ? color.accent : color.borderSub}`,
        background: selected ? tint(color.accent, 10) : color.surface,
        color: selected ? color.textHi : color.textMid,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Uppercase eyebrow label matching `.label-upper`. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.36)' }}>
      {children}
    </span>
  );
}

export function StepHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header style={{ marginBottom: space.lg }}>
      <h2 style={{ fontSize: t.section, fontWeight: 700, letterSpacing: '-0.01em', color: color.textHi, margin: 0 }}>{title}</h2>
      {description && <p style={{ fontSize: t.body, color: color.textMid, marginTop: space.sm, maxWidth: 620 }}>{description}</p>}
    </header>
  );
}
