import { AlertTriangle, Loader2 } from 'lucide-react';
import { color, radius, space, tint, type as t } from '../tokens';
import { Button } from './ui';

/** Shared loading / error surfaces for the two engine-backed steps. */

export function EngineLoading({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: space.md, padding: space.lg,
      borderRadius: radius.md, border: `1px solid ${color.borderSub}`,
      background: color.surface, color: color.textMid, fontSize: t.support + 1,
    }}>
      <Loader2 size={18} aria-hidden strokeWidth={1.75}
        style={{ color: color.accent, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
      <span>{label}</span>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}

export function EngineError({
  message, onRetry, endpoint = '/api/synthetic-portfolio/twin',
}: { message: string; onRetry: () => void; endpoint?: string }) {
  return (
    <div style={{
      padding: space.lg, borderRadius: radius.md,
      border: `1px solid ${tint(color.danger, 35)}`, background: tint(color.danger, 7),
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: space.md, marginBottom: space.md }}>
        <AlertTriangle size={18} aria-hidden strokeWidth={1.75}
          style={{ color: color.danger, flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ color: color.textHi, fontSize: t.body, fontWeight: 600, marginBottom: 4 }}>
            The engine did not respond
          </div>
          <div style={{ color: color.textMid, fontSize: t.support }}>{message}</div>
          <div style={{ color: color.textLo, fontSize: t.support, marginTop: 6 }}>
            The backend serves this at <code>{endpoint}</code>.
          </div>
        </div>
      </div>
      <Button variant="ghost" onClick={onRetry}>Try again</Button>
    </div>
  );
}
