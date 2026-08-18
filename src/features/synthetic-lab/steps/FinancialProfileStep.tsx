import { color, radius, space, tint } from '../tokens';
import { CurrencyInput, Eyebrow, Panel, SelectCard, StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';
import type { LabDraftApi } from '../state/useLabDraft';

const MIN_BUDGET = 1_000;

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
  const budgetRaw = profile.budget;
  const budget = typeof budgetRaw === 'number' && !Number.isNaN(budgetRaw) ? budgetRaw : undefined;
  const budgetValid = budget !== undefined && budget >= MIN_BUDGET;

  const essentialDone = budgetValid && BLOCKS.filter((b) => b.essential).every((b) => profile[b.key] !== undefined);
  const answered = BLOCKS.filter((b) => profile[b.key] !== undefined).length + (budgetValid ? 1 : 0);
  const totalFields = BLOCKS.length + 1;

  const labelFor = (b: Block) => b.options.find((o) => o.value === profile[b.key])?.label;

  return (
    <div>
      <StepHeading title="Your financial profile"
        description="A few quick blocks about your goals and situation. Pick what fits best — you can change these later." />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xl, alignItems: 'flex-start' }}>
        {/* blocks */}
        <div style={{ flex: '1 1 420px', display: 'grid', gap: space.lg }}>
          <div>
            <div style={{ marginBottom: space.sm }}>
              <Eyebrow>Investment budget</Eyebrow>
            </div>
            <CurrencyInput
              value={budget}
              onChange={(n) => draftApi.setProfileField('budget', n)}
              placeholder="100,000"
              min={0}
              max={1_000_000_000}
              style={{ maxWidth: 280 }}
            />
            <p style={{ fontSize: 12, color: color.textLo, marginTop: 6 }}>
              How much you want this portfolio to size for — every dollar figure in the Twin,
              Portfolio and Forecast steps scales from this number instead of a rough bracket.
            </p>
          </div>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.sm, fontSize: 13 }}>
              <span style={{ color: color.textLo }}>Budget</span>
              <span style={{ color: budgetValid ? color.textHi : color.textLo, fontWeight: 600, textAlign: 'right' }}>
                {budgetValid ? `$${budget.toLocaleString('en-US')}` : '—'}
              </span>
            </div>
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
            {answered} of {totalFields} answered · saved automatically
          </div>
        </Panel>
      </div>

      <StepFooter onBack={onBack} onContinue={onContinue}
        continueLabel="Continue to the quiz" continueDisabled={!essentialDone} />

      {!essentialDone && (
        <p style={{ fontSize: 12, color: color.textLo, marginTop: space.sm, background: tint(color.warning, 6), padding: '6px 10px', borderRadius: radius.sm, display: 'inline-block' }}>
          {budgetValid ? 'Pick a main goal and a horizon to continue.' : `Set a budget of at least $${MIN_BUDGET.toLocaleString('en-US')}, a main goal, and a horizon to continue.`}
        </p>
      )}
    </div>
  );
}
