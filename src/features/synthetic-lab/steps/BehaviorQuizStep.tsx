import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { color, radius, space, tint, type as t } from '../tokens';
import { Eyebrow, Panel, StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';
import LikertScale from '../components/LikertScale';
import { QUIZ_QUESTIONS } from '../data/quizContent';
import type { LabDraftApi } from '../state/useLabDraft';

interface Props {
  draftApi: LabDraftApi;
  onBack: () => void;
  onContinue: () => void;
}

export default function BehaviorQuizStep({ draftApi, onBack, onContinue }: Props) {
  const reduce = useReducedMotion();
  const total = QUIZ_QUESTIONS.length;
  const answers = draftApi.draft.quiz;

  // start at the first unanswered question
  const firstUnanswered = QUIZ_QUESTIONS.findIndex((q) => answers[q.id] === undefined);
  const [index, setIndex] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);

  const q = QUIZ_QUESTIONS[index];
  const value = answers[q.id];
  const answeredCount = QUIZ_QUESTIONS.filter((qq) => answers[qq.id] !== undefined).length;
  const isLast = index === total - 1;

  const select = (v: number) => draftApi.setQuizAnswer(q.id, v);
  const back = () => (index > 0 ? setIndex((i) => i - 1) : onBack());
  const cont = () => (isLast ? onContinue() : setIndex((i) => i + 1));

  return (
    <div style={{ maxWidth: 640 }}>
      <StepHeading title="A few questions about how you decide"
        description="One at a time. There are no right answers — your honest reaction is what matters." />

      {/* progress */}
      <div style={{ marginBottom: space.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: color.textLo, marginBottom: 6 }}>
          <span>Question {index + 1} of {total}</span>
          <span>{answeredCount} answered</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: color.surface, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            style={{ height: '100%', borderRadius: 999, background: color.accent }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={q.id}
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          <Panel style={{ borderRadius: radius.lg }}>
            <Eyebrow>{q.dimension}</Eyebrow>
            <p style={{ fontSize: t.card + 2, fontWeight: 600, color: color.textHi, margin: `${space.sm}px 0 ${space.lg}px`, lineHeight: 1.4 }}>
              {q.text}
            </p>
            <LikertScale value={value} onChange={select} />
            {q.help && (
              <p style={{ fontSize: 12, color: color.textLo, marginTop: space.md, background: tint(color.accent, 5), padding: '8px 10px', borderRadius: radius.sm }}>
                {q.help}
              </p>
            )}
          </Panel>
        </motion.div>
      </AnimatePresence>

      <StepFooter onBack={back} onContinue={cont}
        continueLabel={isLast ? 'Continue to scenarios' : 'Next'}
        continueDisabled={value === undefined} />
    </div>
  );
}
