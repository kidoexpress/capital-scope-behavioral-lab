/**
 * Design tokens for the Financial Twin Lab (Synthetic Lab) redesign.
 * Reuses the app's CSS variables — no stray hex in components.
 * Accent is used ONLY for: primary action, current step, selected data,
 * key chart line, important highlight.
 */

export const space = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = { sm: 10, md: 12, lg: 16 } as const;

export const type = {
  page: 32,     // 32–36
  section: 22,  // 20–24
  card: 17,     // 16–18
  body: 15,     // 14–16
  support: 13,  // 13–14
} as const;

export const breakpoints = { xs: 390, sm: 768, md: 1024, lg: 1280, xl: 1440 } as const;

/** Semantic colors (always pair with icon + text, never color alone). */
export const color = {
  accent: 'var(--accent)',
  accentDim: 'var(--accent-dim, color-mix(in srgb, var(--accent) 15%, transparent))',
  positive: 'var(--green)',
  warning: 'var(--amber)',
  danger: 'var(--red)',
  textHi: 'var(--text-hi)',
  textMid: 'var(--text-mid)',
  textLo: 'var(--text-lo)',
  surface: 'var(--bg-surface)',
  raised: 'var(--bg-raised)',
  base: 'var(--bg-base)',
  borderSub: 'var(--border-sub)',
  borderSoft: 'var(--border-soft)',
} as const;

export const layout = {
  maxWidth: 1280,
  sidePadding: 32,
} as const;

/** color-mix tint helper for translucent surfaces/borders. */
export const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
