/**
 * Deterministic market price equations (RESEARCH_SPEC §3).
 *
 * These are pure functions: the ONLY source of randomness is the epsilon term,
 * which the caller supplies (drawn from a seeded PRNG). This keeps the engine
 * fully reproducible.
 *
 *   positive feedback:  p_t = (20/21) * (avg_forecast + 3)   + epsilon
 *   negative feedback:  p_t = (20/21) * (123 - avg_forecast) + epsilon
 *
 *   epsilon ~ Normal(0, 1/4)  =>  stdDev = 0.5
 */
import type { FeedbackType } from '../schemas/common';
import type { Prng } from './prng';
import { gaussian } from './prng';

const COEFF = 20 / 21;

/** Standard deviation of epsilon (variance 1/4). */
export const EPSILON_STD_DEV = 0.5;

export function positiveFeedbackPrice(averageForecast: number, epsilon: number): number {
  return COEFF * (averageForecast + 3) + epsilon;
}

export function negativeFeedbackPrice(averageForecast: number, epsilon: number): number {
  return COEFF * (123 - averageForecast) + epsilon;
}

/** Draw the period noise epsilon from a seeded PRNG. */
export function drawEpsilon(prng: Prng): number {
  return gaussian(prng, 0, EPSILON_STD_DEV);
}

/**
 * Compute the realized price for a period given the feedback regime, the
 * average forecast, and a supplied epsilon (deterministic given the PRNG).
 */
export function realizedPrice(
  feedback: FeedbackType,
  averageForecast: number,
  epsilon: number,
): number {
  return feedback === 'positive'
    ? positiveFeedbackPrice(averageForecast, epsilon)
    : negativeFeedbackPrice(averageForecast, epsilon);
}
