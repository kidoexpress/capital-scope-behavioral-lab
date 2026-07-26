/**
 * Behavior quiz content for the UI (presentation only — no scoring here).
 * A representative core set; the full/adaptive set will come from the backend.
 */

export interface QuizQuestion {
  id: string;
  dimension: string;
  text: string;
  reverse?: boolean;
  help?: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 'loss_aversion', dimension: 'Loss sensitivity',
    text: 'A loss of $1,000 bothers me more than a gain of $1,000 satisfies me.' },
  { id: 'strategy_commitment', dimension: 'Discipline',
    text: 'I keep my investment strategy even during bad periods.' },
  { id: 'emotional_stability', dimension: 'Reaction to volatility', reverse: true,
    text: 'An unexpected market drop stays on my mind for a long time.',
    help: 'There are no right answers — go with your honest reaction.' },
  { id: 'herding', dimension: 'External influence',
    text: 'I feel more comfortable buying an investment when many people are buying it.' },
  { id: 'financial_self_control', dimension: 'Discipline',
    text: 'I can keep investing even when tempting purchases come up.' },
  { id: 'liquidity_anxiety', dimension: 'Liquidity preference',
    text: 'I need to know I can withdraw my money at any time.' },
  { id: 'advisor_trust', dimension: 'External influence',
    text: 'I trust recommendations from a human advisor I know.' },
  { id: 'ai_trust', dimension: 'External influence',
    text: 'I would follow an allocation suggested by an automated system.' },
  { id: 'reaction_to_losses', dimension: 'Loss sensitivity',
    text: 'I find it hard to hold investments when I see a sharp drop.' },
  { id: 'overconfidence', dimension: 'Confidence',
    text: 'I usually spot good opportunities before most people do.' },
  { id: 'openness', dimension: 'Openness',
    text: 'I like exploring new ways to invest, even when I already have a familiar option.' },
  { id: 'ambiguity_aversion', dimension: 'Openness', reverse: true,
    text: 'I avoid investments when I do not fully understand every possible outcome.' },
];

export const LIKERT_LABELS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
] as const;
