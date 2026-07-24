import { describe, it, expect } from 'vitest';
import {
  validateAgentDecision,
  isPortfolioAction,
} from '../schemas/agentDecision';
import type { AgentDecision } from '../schemas/agentDecision';
import {
  PORTFOLIO_ACTIONS,
  ADVERSE_BEHAVIORS,
  MEMORY_LENGTHS,
  FORECAST_MIN,
  FORECAST_MAX,
} from '../schemas/common';

const validDecision: AgentDecision = {
  forecast: 65.4,
  confidence: 0.72,
  portfolio_action: 'HOLD',
  allocation_change: 0.0,
  request_advisor: false,
  reason_codes: ['recent_uptrend', 'within_risk_limit'],
};

describe('validateAgentDecision', () => {
  it('accepts a well-formed decision', () => {
    const r = validateAgentDecision(validDecision);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateAgentDecision(null).valid).toBe(false);
    expect(validateAgentDecision(42).valid).toBe(false);
  });

  it('rejects out-of-range forecast', () => {
    const r = validateAgentDecision({ ...validDecision, forecast: FORECAST_MAX + 1 });
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('forecast');
  });

  it('rejects out-of-range confidence', () => {
    expect(validateAgentDecision({ ...validDecision, confidence: 1.5 }).valid).toBe(false);
  });

  it('rejects an unknown portfolio_action', () => {
    const r = validateAgentDecision({ ...validDecision, portfolio_action: 'YOLO' });
    expect(r.valid).toBe(false);
  });

  it('rejects allocation_change outside [-1, 1]', () => {
    expect(validateAgentDecision({ ...validDecision, allocation_change: 2 }).valid).toBe(false);
  });

  it('rejects non-string reason_codes', () => {
    expect(validateAgentDecision({ ...validDecision, reason_codes: [1, 2] }).valid).toBe(false);
  });
});

describe('constants & guards', () => {
  it('isPortfolioAction recognizes all actions', () => {
    for (const a of PORTFOLIO_ACTIONS) expect(isPortfolioAction(a)).toBe(true);
    expect(isPortfolioAction('NOPE')).toBe(false);
  });

  it('has the expected enumerations', () => {
    expect(PORTFOLIO_ACTIONS).toHaveLength(5);
    expect(ADVERSE_BEHAVIORS).toHaveLength(6);
    expect(MEMORY_LENGTHS).toEqual([1, 3, 5]);
    expect(FORECAST_MIN).toBe(1);
    expect(FORECAST_MAX).toBe(100);
  });
});
