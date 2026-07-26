import { Activity, BarChart3, Brain, Clock, ShieldCheck } from 'lucide-react';
import { color, radius, space, type as t } from '../tokens';
import { Button } from '../components/ui';

interface Props {
  onPrimary: () => void;
  onDemo: () => void;
}

const BENEFITS = [
  { icon: Brain, text: 'Understand your financial behavior' },
  { icon: Activity, text: 'Test reactions to market events' },
  { icon: BarChart3, text: 'Build and simulate a portfolio' },
];

const INFO = [
  { icon: Clock, text: 'Takes about 6–9 minutes' },
  { icon: ShieldCheck, text: 'Answers can be reviewed · results are probabilistic · no real trades are executed' },
];

export default function IntroductionStep({ onPrimary, onDemo }: Props) {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: t.page, fontWeight: 800, letterSpacing: '-0.02em', color: color.textHi, margin: 0 }}>
        Build your Financial Twin
      </h1>
      <p style={{ fontSize: t.body + 1, lineHeight: 1.6, color: color.textMid, marginTop: space.md, maxWidth: 620 }}>
        Answer a short behavior and financial profile quiz. We will create a synthetic financial
        profile, test how it may react to market events, and build a portfolio that matches your
        goals and behavior.
      </p>

      <div style={{ display: 'grid', gap: space.md, marginTop: space.xl }}>
        {BENEFITS.map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
            <span style={{
              width: 38, height: 38, borderRadius: radius.sm, flexShrink: 0, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', background: color.raised,
              border: `1px solid ${color.borderSub}`, color: color.accent,
            }}>
              <Icon size={18} aria-hidden strokeWidth={1.75} />
            </span>
            <span style={{ fontSize: t.body, color: color.textHi }}>{text}</span>
          </div>
        ))}
      </div>

      <ul style={{ listStyle: 'none', margin: `${space.xl}px 0 0`, padding: 0, display: 'grid', gap: space.sm }}>
        {INFO.map(({ icon: Icon, text }) => (
          <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: space.sm, fontSize: t.support + 1, color: color.textLo }}>
            <Icon size={15} aria-hidden strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.sm, marginTop: space.xxl }}>
        <Button onClick={onPrimary}>Create my Financial Twin</Button>
        <Button variant="ghost" onClick={onDemo}>Use a demo profile</Button>
      </div>
    </div>
  );
}
