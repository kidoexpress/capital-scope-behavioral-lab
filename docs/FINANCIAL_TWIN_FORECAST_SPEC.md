# Financial Twin — Forecast Spec

Never show a single point return. Always show a **distribution** for **3, 6 and 12
months**. No future data in any forecast or backtest (temporal separation enforced).

## Per-horizon output

expected_return, median_return, p05, p25, p75, p95, probability_of_loss,
expected_volatility, var_95, cvar_95, estimated drawdown, estimated final value,
probability_of_goal.

```
{ "horizon_months": 6, "expected_return": 0.061, "median_return": 0.052,
  "return_range": {"p05": -0.094, "p25": -0.012, "p75": 0.118, "p95": 0.224},
  "probability_of_loss": 0.29, "expected_volatility": 0.14,
  "var_95": -0.094, "cvar_95": -0.137, "probability_of_goal": 0.64 }
```

## Simulation methods

1. Historical Bootstrap
2. **Stationary Block Bootstrap** (params: block_length, number_of_paths,
   horizon_days, seed) — preserves part of the temporal dependence
3. Parametric Monte Carlo — multivariate mean + shrinkage covariance; Normal **or
   Student-t** (heavier tails; do not assume perfect normality)
4. Regime-Conditional Monte Carlo
5. Stress Scenarios

Production: ≥ 10,000 paths per horizon; reducible for tests. Seeded → reproducible.

## Market regimes (`MarketRegimeModel`)

Initial rule-based classification into: bull_low_vol, bull_high_vol, bear_high_vol,
sideways_low_vol, risk_off, inflationary, rate_shock. Interface prepared for a future
`HiddenMarkovRegimeModel` (HMM **not** required for the first MVP).

## Stress tests

equities −10/−25/−40%, rates +2pp, inflation +3pp, USD +15%, credit spread widening,
correlations converging in crisis, unexpected withdrawal, temporary income loss.

## Backtest (walk-forward)

Train/test separated in time; never use future data; monthly or quarterly rebalance;
transaction costs; taxes configurable but **off** in the first MVP; benchmark
comparison; record dates and per-period parameters.

Benchmarks: 100% pós-fixado, 60/40, equal weight, risk parity, minimum variance,
user's current portfolio, Financial Twin Portfolio **without** memory, and **with**
memory.

## Anti-leakage tests

Explicit tests assert forecasters/backtests only see data before the cutoff, quantiles
are ordered, horizons correct, probability_of_loss ∈ [0,1], and interval coverage.
