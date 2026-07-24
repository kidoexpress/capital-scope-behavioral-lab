/**
 * The core agent contract. Every agent kind implements `decide`.
 *
 * Agents observe the market, consult bounded memory and an optional
 * intervention, and PROPOSE a structured decision. They never mutate market
 * state, balances, portfolios, equations or persisted records — the
 * deterministic engine does that after validating the proposal.
 */
import type { AgentDecision } from '../schemas/agentDecision';
import type { PersonaState } from '../personas/types';
import type { Intervention } from '../interventions/types';
import type { MemoryLength, PortfolioAction } from '../schemas/common';

/** What the agent can see about the market this period. */
export interface MarketObservation {
  period: number;
  /** Realized prices up to and including the previous period. */
  price_history: number[];
  /** Average forecast of the last period, if any. */
  last_average_forecast: number | null;
  fundamental_value: number;
}

/** Bounded per-agent memory window. */
export interface AgentMemory {
  length: MemoryLength;
  recent_prices: number[];
  recent_forecasts: number[];
  recent_actions: PortfolioAction[];
}

/** The contract implemented by Rule/LLM/Hybrid/HumanReplay agents. */
export interface InvestorAgent {
  readonly id: string;
  readonly persona: PersonaState;
  decide(
    observation: MarketObservation,
    memory: AgentMemory,
    intervention: Intervention | null,
  ): AgentDecision;
}
