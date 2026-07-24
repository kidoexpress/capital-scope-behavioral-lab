/**
 * Metric result shapes (PRODUCT_SPEC §6, RESEARCH_SPEC §4–5).
 * Computation lands in a later step; these lock the output contract.
 */

export interface BehavioralMetrics {
  panic_sell_rate: number;
  advisor_escalation_rate: number;
  profile_violation_rate: number;
  average_turnover: number;
  average_cash_shift: number;
  average_confidence_change: number;
  persona_adherence_score: number;
  unexplained_strategy_switch_rate: number;
}

export interface MarketMetrics {
  forecast_rmse: number;
  forecast_dispersion: number;
  price_volatility: number;
  convergence_time: number;
  maximum_deviation_from_fundamental: number;
  bubble_amplitude: number;
}

/** Strategy estimation coefficients (RESEARCH_SPEC §4). */
export interface StrategyMetrics {
  alpha_1: number;
  alpha_2: number;
  /** > 0 trend, ~0 neutral, < 0 reversion. */
  beta: number;
}

/** Aggregated per-variant metrics across runs. */
export interface VariantMetrics {
  behavioral: BehavioralMetrics;
  market: MarketMetrics;
  strategy: StrategyMetrics;
  /** Rate of adverse behaviors, 0..1. */
  adverse_behavior_rate: number;
}

/** Head-to-head comparison output. */
export interface InterventionComparison {
  control: VariantMetrics;
  treatment: VariantMetrics;
  /** control.adverse_behavior_rate - treatment.adverse_behavior_rate */
  intervention_effect_score: number;
}
