/**
 * Capital Scope Behavioral Lab — shared primitive types.
 *
 * These are the vocabulary shared across agents, simulation, metrics and replay.
 * No runtime market logic lives here — only types and small const lookups.
 */

/** Market feedback regime (see RESEARCH_SPEC §3). */
export type FeedbackType = 'positive' | 'negative';

/** Agents may remember the last 1, 3 or 5 periods. */
export type MemoryLength = 1 | 3 | 5;
export const MEMORY_LENGTHS = [1, 3, 5] as const;

/** Structured portfolio actions an agent may propose. Never free text. */
export type PortfolioAction =
  | 'BUY'
  | 'SELL'
  | 'HOLD'
  | 'MOVE_TO_CASH'
  | 'REQUEST_REVIEW';

export const PORTFOLIO_ACTIONS: readonly PortfolioAction[] = [
  'BUY',
  'SELL',
  'HOLD',
  'MOVE_TO_CASH',
  'REQUEST_REVIEW',
] as const;

/** Adverse behaviors counted for the Intervention Effect Score. */
export type AdverseBehavior =
  | 'panic_sell'
  | 'profile_violation'
  | 'excessive_turnover'
  | 'excessive_cash_shift'
  | 'low_understanding_decision'
  | 'unexplained_strategy_switch';

export const ADVERSE_BEHAVIORS: readonly AdverseBehavior[] = [
  'panic_sell',
  'profile_violation',
  'excessive_turnover',
  'excessive_cash_shift',
  'low_understanding_decision',
  'unexplained_strategy_switch',
] as const;

/** Free-form-but-controlled machine reason codes attached to a decision. */
export type ReasonCode = string;

/** Minimal portfolio snapshot carried in agent state. */
export interface PortfolioSnapshot {
  /** Fraction of wealth held in the risky asset, 0..1. */
  risky_weight: number;
  /** Fraction of wealth held in cash, 0..1. */
  cash_weight: number;
}

/** Fundamental value anchor used across the lab (RESEARCH_SPEC §2). */
export const FUNDAMENTAL_VALUE = 60;

/** Forecasts are bounded to [1, 100]. */
export const FORECAST_MIN = 1;
export const FORECAST_MAX = 100;
