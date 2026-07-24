/**
 * Structured agent output schema + runtime validator.
 *
 * Agents (rule-based today, LLM later) may only PROPOSE decisions. The
 * deterministic engine validates every proposal with `validateAgentDecision`
 * before it is allowed to affect the simulation. Invalid proposals are rejected.
 */
import type { PortfolioAction, ReasonCode } from './common';
import { PORTFOLIO_ACTIONS, FORECAST_MIN, FORECAST_MAX } from './common';

export interface AgentDecision {
  /** Price/level forecast, bounded to [1, 100]. */
  forecast: number;
  /** Self-reported confidence, 0..1. */
  confidence: number;
  /** Structured action; never free text. */
  portfolio_action: PortfolioAction;
  /** Change to risky-asset allocation, -1..1. */
  allocation_change: number;
  /** Whether the agent escalates to a human advisor. */
  request_advisor: boolean;
  /** Machine-readable justification codes. */
  reason_codes: ReasonCode[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isPortfolioAction(value: unknown): value is PortfolioAction {
  return (
    typeof value === 'string' &&
    (PORTFOLIO_ACTIONS as readonly string[]).includes(value)
  );
}

/**
 * Validate an untrusted decision object (e.g. from a future LLM) against the
 * schema. Returns collected errors rather than throwing, so the engine can log
 * and fall back deterministically.
 */
export function validateAgentDecision(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['decision must be a non-null object'] };
  }
  const d = input as Record<string, unknown>;

  if (typeof d.forecast !== 'number' || Number.isNaN(d.forecast)) {
    errors.push('forecast must be a number');
  } else if (d.forecast < FORECAST_MIN || d.forecast > FORECAST_MAX) {
    errors.push(`forecast must be within [${FORECAST_MIN}, ${FORECAST_MAX}]`);
  }

  if (typeof d.confidence !== 'number' || d.confidence < 0 || d.confidence > 1) {
    errors.push('confidence must be a number within [0, 1]');
  }

  if (!isPortfolioAction(d.portfolio_action)) {
    errors.push('portfolio_action must be one of ' + PORTFOLIO_ACTIONS.join(', '));
  }

  if (
    typeof d.allocation_change !== 'number' ||
    d.allocation_change < -1 ||
    d.allocation_change > 1
  ) {
    errors.push('allocation_change must be a number within [-1, 1]');
  }

  if (typeof d.request_advisor !== 'boolean') {
    errors.push('request_advisor must be a boolean');
  }

  if (
    !Array.isArray(d.reason_codes) ||
    !d.reason_codes.every((c) => typeof c === 'string')
  ) {
    errors.push('reason_codes must be an array of strings');
  }

  return { valid: errors.length === 0, errors };
}

export { isPortfolioAction };
