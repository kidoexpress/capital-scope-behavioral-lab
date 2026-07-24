/**
 * Seeded pseudo-random number generator for reproducible runs.
 *
 * A given seed must always produce the same stream — this is what makes replay
 * and the audit trail deterministic. Uses mulberry32 (fast, adequate for
 * simulation, NOT cryptographic).
 */
export interface Prng {
  /** Uniform in [0, 1). */
  next(): number;
}

/** mulberry32 seeded PRNG. */
export function createPrng(seed: number): Prng {
  let a = seed >>> 0;
  return {
    next(): number {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/**
 * Standard-normal sample via Box–Muller, drawn from a seeded PRNG.
 * Scale by the desired standard deviation for other variances.
 */
export function gaussian(prng: Prng, mean = 0, stdDev = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = prng.next();
  while (v === 0) v = prng.next();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stdDev;
}
