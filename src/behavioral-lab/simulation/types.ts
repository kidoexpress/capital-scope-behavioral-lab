/**
 * Simulation state and result types.
 */
import type { AgentDecision } from '../schemas/agentDecision';
import type { FeedbackType } from '../schemas/common';

/** One period's fully-resolved record (input to the audit trail). */
export interface PeriodRecord {
  period: number;
  average_forecast: number;
  epsilon: number;
  price: number;
  decisions: Record<string, AgentDecision>; // agentId -> validated decision
}

/** Immutable inputs that fully determine a single run. */
export interface RunSpec {
  seed: number;
  feedback_type: FeedbackType;
  periods: number;
  initial_fundamental: number;
  agent_ids: string[];
}

/** The output of a single deterministic run. */
export interface RunResult {
  spec: RunSpec;
  prices: number[];
  average_forecasts: number[];
  periods: PeriodRecord[];
}
