/**
 * Persona types and mutable per-agent state.
 */
import type {
  MemoryLength,
  PortfolioAction,
  PortfolioSnapshot,
} from '../schemas/common';

export type PersonaType =
  | 'conservative'
  | 'fundamentalist'
  | 'trend_follower'
  | 'contrarian';

export const PERSONA_TYPES: readonly PersonaType[] = [
  'conservative',
  'fundamentalist',
  'trend_follower',
  'contrarian',
] as const;

/** Static behavioral traits that parameterize a persona (all 0..1). */
export interface PersonaTraits {
  risk_tolerance: number;
  loss_aversion: number;
  trend_sensitivity: number; // may be negative for contrarian
  advisor_trust: number;
  ai_trust: number;
  liquidity_preference: number;
}

/** Full mutable state of a persona during a run. */
export interface PersonaState extends PersonaTraits {
  type: PersonaType;
  confidence: number;
  memory_length: MemoryLength;
  current_portfolio: PortfolioSnapshot;
  accumulated_earnings: number;
  previous_forecasts: number[];
  previous_actions: PortfolioAction[];
}
