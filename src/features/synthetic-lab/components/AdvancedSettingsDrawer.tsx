import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { color, radius, space } from '../tokens';
import type { AdvancedSettings } from '../state/useLabDraft';

interface Props {
  settings: AdvancedSettings;
  onChange: (patch: Partial<AdvancedSettings>) => void;
}

/** Technical controls (seed, memory, #simulations) — closed by default. */
export default function AdvancedSettingsDrawer({ settings, onChange }: Props) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  const fieldLabel: React.CSSProperties = { fontSize: 12, color: color.textMid, display: 'flex', flexDirection: 'column', gap: 4 };
  const input: React.CSSProperties = {
    height: 34, padding: '0 10px', borderRadius: radius.sm, border: `1px solid ${color.borderSub}`,
    background: color.surface, color: color.textHi, outline: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
  };

  return (
    <div style={{ border: `1px solid ${color.borderSub}`, borderRadius: radius.md, background: color.surface }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: space.sm, padding: `${space.sm + 2}px ${space.md}px`, background: 'none', border: 'none',
          cursor: 'pointer', color: color.textMid, fontSize: 13,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: space.sm }}>
          <Settings2 size={15} aria-hidden /> Advanced settings
        </span>
        <ChevronDown size={16} aria-hidden style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: space.md,
              padding: `0 ${space.md}px ${space.md}px`,
            }}>
              <label style={fieldLabel}>
                Seed
                <input type="number" value={settings.seed} style={input}
                  onChange={(e) => onChange({ seed: Number(e.target.value) })} />
              </label>
              <label style={fieldLabel}>
                Simulations per variant
                <input type="number" min={1} max={200} value={settings.numSimulations} style={input}
                  onChange={(e) => onChange({ numSimulations: Number(e.target.value) })} />
              </label>
              <label style={{ ...fieldLabel, flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 20 }}>
                <input type="checkbox" checked={settings.useMemory}
                  onChange={(e) => onChange({ useMemory: e.target.checked })} />
                Use previous decisions
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
