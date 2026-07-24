import { describe, it, expect } from 'vitest';
import { PERSONA_TYPES } from '../personas/types';
import { PERSONA_PRESETS } from '../personas/presets';
import {
  CONTROL_INTERVENTION,
  TREATMENT_INTERVENTION,
} from '../interventions/types';

describe('persona presets', () => {
  it('defines all four persona types', () => {
    expect(PERSONA_TYPES).toEqual([
      'conservative',
      'fundamentalist',
      'trend_follower',
      'contrarian',
    ]);
  });

  it('has a preset for every persona type', () => {
    for (const t of PERSONA_TYPES) {
      expect(PERSONA_PRESETS[t]).toBeDefined();
    }
  });

  it('encodes the contrarian with negative trend sensitivity', () => {
    expect(PERSONA_PRESETS.contrarian.trend_sensitivity).toBeLessThan(0);
    expect(PERSONA_PRESETS.trend_follower.trend_sensitivity).toBeGreaterThan(0);
  });

  it('gives the conservative the lowest risk tolerance', () => {
    const rt = PERSONA_TYPES.map((t) => PERSONA_PRESETS[t].risk_tolerance);
    expect(Math.min(...rt)).toBe(PERSONA_PRESETS.conservative.risk_tolerance);
  });
});

describe('intervention presets (PRODUCT_SPEC §2)', () => {
  it('control is generic (no context, no advisor)', () => {
    expect(CONTROL_INTERVENTION.kind).toBe('control');
    expect(CONTROL_INTERVENTION.includes_portfolio_impact).toBe(false);
    expect(CONTROL_INTERVENTION.offers_advisor).toBe(false);
  });

  it('treatment adds context, risk explanation and advisor', () => {
    expect(TREATMENT_INTERVENTION.kind).toBe('treatment');
    expect(TREATMENT_INTERVENTION.includes_portfolio_impact).toBe(true);
    expect(TREATMENT_INTERVENTION.includes_risk_explanation).toBe(true);
    expect(TREATMENT_INTERVENTION.offers_advisor).toBe(true);
  });
});
