/**
 * Experiment & variant configuration schema.
 *
 * A comparison experiment holds two variants (control vs. treatment) that share
 * EVERYTHING except the intervention: same personas, seed, market, initial
 * state, shocks and intervention window (see PRODUCT_SPEC §2).
 */
import type { FeedbackType, MemoryLength } from './common';
import type { PersonaType } from '../personas/types';
import type { Intervention } from '../interventions/types';

/** Which side of the A/B comparison a variant represents. */
export type VariantKind = 'control' | 'treatment';

/** A deterministic market shock injected at a given period. */
export interface MarketShock {
  period: number;
  /** Additive shock to the realized price at that period. */
  magnitude: number;
  label?: string;
}

/** Shared, variant-invariant configuration. */
export interface SharedExperimentConfig {
  seed: number;
  feedback_type: FeedbackType;
  personas: PersonaType[]; // expected length: 6 for the MVP
  memory_length: MemoryLength;
  periods: number; // 50 for the MVP
  runs_per_variant: number; // 20 for the MVP
  initial_fundamental: number; // 60 for the MVP
  shocks: MarketShock[];
  /** Periods during which the intervention is delivered. */
  intervention_window: [number, number];
}

/** One variant = shared config + a specific intervention. */
export interface Variant {
  kind: VariantKind;
  intervention: Intervention;
}

/** A full comparison experiment. */
export interface ExperimentConfig {
  id: string;
  name: string;
  shared: SharedExperimentConfig;
  control: Variant;
  treatment: Variant;
  created_at: string; // ISO-8601
}
