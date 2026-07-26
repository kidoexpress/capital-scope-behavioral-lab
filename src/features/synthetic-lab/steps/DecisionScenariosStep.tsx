import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { color, radius, space, tint, type as t } from '../tokens';
import { Eyebrow, Panel, SelectCard, StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';
import { SCENARIOS } from '../data/scenarioContent';
import type { LabDraftApi } from '../state/useLabDraft';

interface Props {
  draftApi: LabDraftApi;
  onBack: () => void;
  onContinue: () => void;
}

const CONFIDENCE = [
  { label: 'Not sure', value: 0.3 },
  { label: 'Fairly sure', value: 0.6 },
  { label: 'Very sure', value: 0.9 },
];

export default function DecisionScenariosStep({ draftApi, onBack, onContinue }: Props) {
  const reduce = useReducedMotion();
  const total = SCENARIOS.length;
  const answers = draftApi.draft.scenarios;

  const firstUnanswered = SCENARIOS.findIndex((s) => !answers[s.id]);
  const [index, setIndex] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);

  const s = SCENARIOS[index];
  const answer = answers[s.id];
  const isLast = index === total - 1;

  const choose = (choice: string) =>
    draftApi.setScenarioAnswer(s.id, { choice, confidence: answer?.confidence ?? 0.6 });
  const setConfidence = (confidence: number) =>
    draftApi.setScenarioAnswer(s.id, { choice: answer?.choice ?? '', confidence });

  const back = () => (index > 0 ? setIndex((i) => i - 1) : onBack());
  const cont = () => (isLast ? onContinue() : setIndex((i) => i + 1));

  return (
    <div style={{ maxWidth: 640 }}>
      <StepHeading title="What would you actually do?"
        description="Concrete situations. Pick the action you would most likely take — this reveals how you behave, not just what you say." />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: color.textLo, marginBottom: space.md }}>
        <span>Scenario {index + 1} of {total}</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={s.id}
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          <Panel style={{ borderRadius: radius.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
              <Eyebrow>Scenario</Eyebrow>
              {s.keyFigure && (
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  color: color.accent, background: tint(color.accent, 12), border: `1px solid ${tint(color.accent, 30)}`,
                }}>{s.keyFigure}</span>
              )}
            </div>
            <h3 style={{ fontSize: t.card + 3, fontWeight: 700, color: color.textHi, margin: 0 }}>{s.title}</h3>
            <p style={{ fontSize: t.body, color: color.textMid, margin: `${space.sm}px 0 ${space.lg}px`, lineHeight: 1.5 }}>{s.context}</p>

            <p style={{ fontSize: t.support + 1, fontWeight: 600, color: color.textMid, marginBottom: space.sm }}>{s.prompt}</p>
            <div style={{ display: 'grid', gap: space.sm }}>
              {s.options.map((o) => (
                <SelectCard key={o.key} selected={answer?.choice === o.key} onClick={() => choose(o.key)}>
                  {o.text}
                </SelectCard>
              ))}
            </div>

            {answer?.choice && (
              <div style={{ marginTop: space.lg, paddingTop: space.md, borderTop: `1px solid ${color.borderSub}` }}>
                <p style={{ fontSize: t.support + 1, fontWeight: 600, color: color.textMid, marginBottom: space.sm }}>How confident are you?</p>
                <div style={{ display: 'flex', gap: space.sm }}>
                  {CONFIDENCE.map((c) => {
                    const on = Math.abs((answer.confidence ?? 0.6) - c.value) < 0.01;
                    return (
                      <button key={c.label} type="button" onClick={() => setConfidence(c.value)}
                        aria-pressed={on}
                        style={{
                          flex: 1, height: 40, borderRadius: radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                          border: `1px solid ${on ? color.accent : color.borderSub}`,
                          background: on ? tint(color.accent, 12) : color.surface,
                          color: on ? color.textHi : color.textMid,
                        }}>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>
        </motion.div>
      </AnimatePresence>

      <StepFooter onBack={back} onContinue={cont}
        continueLabel={isLast ? 'See my Financial Twin' : 'Next scenario'}
        continueDisabled={!answer?.choice} />
    </div>
  );
}
