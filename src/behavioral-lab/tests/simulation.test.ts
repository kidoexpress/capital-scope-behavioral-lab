import { describe, it, expect } from 'vitest';
import { createPrng } from '../simulation/prng';
import {
  positiveFeedbackPrice,
  negativeFeedbackPrice,
  realizedPrice,
} from '../simulation/marketEquations';
import { NotImplementedSimulationEngine } from '../simulation/engine';

const COEFF = 20 / 21;

describe('seeded PRNG', () => {
  it('is deterministic for a given seed', () => {
    const a = createPrng(42);
    const b = createPrng(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different streams for different seeds', () => {
    const a = createPrng(1);
    const b = createPrng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('stays within [0, 1)', () => {
    const p = createPrng(7);
    for (let i = 0; i < 1000; i++) {
      const v = p.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('market equations (RESEARCH_SPEC §3)', () => {
  it('positive feedback matches the spec with zero epsilon', () => {
    // p = (20/21) * (avg + 3)
    expect(positiveFeedbackPrice(60, 0)).toBeCloseTo(COEFF * 63, 10);
  });

  it('negative feedback matches the spec with zero epsilon', () => {
    // p = (20/21) * (123 - avg)
    expect(negativeFeedbackPrice(60, 0)).toBeCloseTo(COEFF * 63, 10);
  });

  it('realizedPrice dispatches on feedback type', () => {
    expect(realizedPrice('positive', 50, 0)).toBeCloseTo(positiveFeedbackPrice(50, 0), 10);
    expect(realizedPrice('negative', 50, 0)).toBeCloseTo(negativeFeedbackPrice(50, 0), 10);
  });

  it('epsilon shifts the price additively', () => {
    expect(positiveFeedbackPrice(60, 2) - positiveFeedbackPrice(60, 0)).toBeCloseTo(2, 10);
  });
});

describe('engine stub', () => {
  it('throws until implemented', () => {
    const engine = new NotImplementedSimulationEngine();
    expect(() =>
      engine.run(
        { seed: 1, feedback_type: 'positive', periods: 50, initial_fundamental: 60, agent_ids: [] },
        [],
        null,
      ),
    ).toThrow(/not implemented/i);
  });
});
