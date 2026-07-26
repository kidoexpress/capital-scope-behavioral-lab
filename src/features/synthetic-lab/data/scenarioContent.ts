/** Decision scenario content for the UI (presentation only). */

export interface ScenarioOptionContent {
  key: string;
  text: string;
}

export interface ScenarioContent {
  id: string;
  title: string;
  context: string;
  /** Optional key figure highlighted in the card. */
  keyFigure?: string;
  prompt: string;
  options: ScenarioOptionContent[];
}

export const SCENARIOS: ScenarioContent[] = [
  {
    id: 'market_drop', title: 'Market drops 15%', keyFigure: '−15%',
    context: 'Your portfolio has fallen 15% over two months. Your long-term goal has not changed.',
    prompt: 'What would you most likely do?',
    options: [
      { key: 'A', text: 'Sell most risky assets' },
      { key: 'B', text: 'Reduce part of the risk' },
      { key: 'C', text: 'Keep the portfolio' },
      { key: 'D', text: 'Invest more' },
      { key: 'E', text: 'Ask an advisor' },
    ],
  },
  {
    id: 'recent_rally', title: 'A fund is up 28%', keyFigure: '+28%',
    context: 'A fund rose 28% in six months and is being talked about by friends and social media.',
    prompt: 'What would you most likely do?',
    options: [
      { key: 'A', text: 'Buy so I do not miss out' },
      { key: 'B', text: 'Buy a small position' },
      { key: 'C', text: 'Ignore the move' },
      { key: 'D', text: 'Research the fundamentals first' },
    ],
  },
  {
    id: 'liquidity_need', title: 'Unexpected expense', keyFigure: '4 months',
    context: 'An unexpected expense equal to four months of spending comes up.',
    prompt: 'How would you cover it?',
    options: [
      { key: 'A', text: 'Sell investments quickly' },
      { key: 'B', text: 'Use my emergency reserve' },
      { key: 'C', text: 'Use part reserve, part investments' },
      { key: 'D', text: 'Look for low-cost credit' },
    ],
  },
  {
    id: 'ai_recommendation', title: 'An AI suggests a change', keyFigure: '15%',
    context: 'An AI system recommends changing 15% of your portfolio.',
    prompt: 'What would you most likely do?',
    options: [
      { key: 'A', text: 'Follow it without reviewing' },
      { key: 'B', text: 'Follow it after understanding why' },
      { key: 'C', text: 'Ignore the recommendation' },
      { key: 'D', text: 'Validate it with a human advisor' },
    ],
  },
  {
    id: 'higher_rates', title: 'Interest rates rise',
    context: 'Rates increase and fixed income now offers a higher expected return.',
    prompt: 'What would you most likely do?',
    options: [
      { key: 'A', text: 'Move a large part to fixed income' },
      { key: 'B', text: 'Increase fixed income a little' },
      { key: 'C', text: 'Keep my current allocation' },
      { key: 'D', text: 'Buy equities that fell' },
    ],
  },
  {
    id: 'long_underperformance', title: '18 months below the benchmark',
    context: 'A strategy has trailed its benchmark for 18 months but still fits the original thesis.',
    prompt: 'What would you most likely do?',
    options: [
      { key: 'A', text: 'Abandon the strategy' },
      { key: 'B', text: 'Reduce the exposure' },
      { key: 'C', text: 'Keep the strategy' },
      { key: 'D', text: 'Add to the position' },
    ],
  },
];
