import { color, radius, space, tint } from '../tokens';
import { Eyebrow, Panel, SelectCard, StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';
import type { LabDraftApi } from '../state/useLabDraft';

interface Props {
  draftApi: LabDraftApi;
  onBack: () => void;
  onContinue: () => void;
}

interface Block {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  essential?: boolean;
}

const BLOCKS: Block[] = [
  { key: 'goal', label: 'Main goal', essential: true, options: [
    { value: 'preservation', label: 'Preserve capital' },
    { value: 'income', label: 'Generate income' },
    { value: 'balanced', label: 'Balanced growth' },
    { value: 'aggressive', label: 'Aggressive growth' },
  ] },
  { key: 'horizon', label: 'Investment horizon', essential: true, options: [
    { value: 'short', label: 'Under 3 years' },
    { value: 'mid', label: '3–7 years' },
    { value: 'long', label: '7–15 years' },
    { value: 'verylong', label: '15+ years' },
  ] },
  { key: 'capital', label: 'Investable capital', options: [
    { value: 'lt50k', label: 'Under $50k' },
    { value: '50to250', label: '$50k–$250k' },
    { value: '250to1m', label: '$250k–$1M' },
    { value: 'gt1m', label: 'Over $1M' },
  ] },
  { key: 'liquidity', label: 'How much do you need available quickly?', options: [
    { value: 'low', label: 'Little' },
    { value: 'medium', label: 'Some' },
    { value: 'high', label: 'A lot' },
  ] },
  { key: 'experience', label: 'Investing experience', options: [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'experienced', label: 'Experienced' },
  ] },
];

export default function FinancialProfileStep({ draftApi, onBack, onContinue }: Props) {
  const profile = draftApi.draft.profile;
  const essentialDone = BLOCKS.filter((b) => b.essential).every((b) => profile[b.key] !== undefined);
  const answered = BLOCKS.filter((b) => profile[b.key] !== undefined).length;

  const labelFor = (b: Block) => b.options.find((o) => o.value === profile[b.key])?.label;

  return (
    <div>
      <StepHeading title="Your financial profile"
        description="A few quick blocks about your goals and situation. Pick what fits best — you can change these later." />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xl, alignItems: 'flex-start' }}>
        {/* blocks */}
        <div style={{ flex: '1 1 420px', display: 'grid', gap: space.lg }}>
          {BLOCKS.map((b) => (
            <div key={b.key}>
              <div style={{ marginBottom: space.sm }}>
                <Eyebrow>{b.label}</Eyebrow>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: space.sm }}>
                {b.options.map((o) => (
                  <SelectCard key={o.value} selected={profile[b.key] === o.value}
                    onClick={() => draftApi.setProfileField(b.key, o.value)}
                    style={{ textAlign: 'center' }}>
                    {o.label}
                  </SelectCard>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* discreet summary column (wraps below on narrow screens) */}
        <Panel style={{ flex: '1 1 220px', maxWidth: 280, position: 'sticky', top: 88 }}>
          <Eyebrow>Your answers</Eyebrow>
          <div style={{ marginTop: space.md, display: 'grid', gap: space.sm }}>
            {BLOCKS.map((b) => (
              <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', gap: space.sm, fontSize: 13 }}>
                <span style={{ color: color.textLo }}>{b.label.replace('How much do you need available quickly?', 'Liquidity need')}</span>
                <span style={{ color: labelFor(b) ? color.textHi : color.textLo, fontWeight: 600, textAlign: 'right' }}>
                  {labelFor(b) ?? '—'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: space.md, paddingTop: space.md, borderTop: `1px solid ${color.borderSub}`, fontSize: 12, color: color.textLo }}>
            {answered} of {BLOCKS.length} answered · saved automatically
          </div>
        </Panel>
      </div>

      <StepFooter onBack={onBack} onContinue={onContinue}
        continueLabel="Continue to the quiz" continueDisabled={!essentialDone} />

      {!essentialDone && (
        <p style={{ fontSize: 12, color: color.textLo, marginTop: space.sm, background: tint(color.warning, 6), padding: '6px 10px', borderRadius: radius.sm, display: 'inline-block' }}>
          Pick a main goal and a horizon to continue.
        </p>
      )}
    </div>
  );
}
