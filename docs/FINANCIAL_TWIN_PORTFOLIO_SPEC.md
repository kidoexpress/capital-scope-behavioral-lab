# Financial Twin — Portfolio Spec

The quantitative engine produces the **final weights** (never the LLM).

## Asset-class universe (MVP — no single stocks)

cash, pós-fixado, inflation-linked, prefixado, private credit, Brazilian equities,
international equities, REITs (FIIs), commodities, gold. Each represented by a
configurable index/proxy with a return series. No individual stock selection in the
first MVP (reduces overfitting, clearer explanation).

## Expected-return models (interface `ExpectedReturnModel`)

1. `HistoricalGeometricReturnModel` (geometric, not arithmetic mean)
2. `ShrunkHistoricalReturnModel` — shrink toward class average + long-term risk
   premium, weighted by sample confidence (reduces extremes)
3. `BlackLittermanReturnModel`
4. `RegimeConditionalReturnModel`

## Covariance models

1. `SampleCovariance`
2. `ExponentiallyWeightedCovariance`
3. `LedoitWolfShrinkageCovariance` (**default**, sklearn available)

Record: period, frequency, missing-data handling, end date, version.

## Black-Litterman

Combines market-implied equilibrium + long-term priors + system-defined scenarios +
quantitative views with confidence. **LLM text is never used directly as a numeric
view** — any model-produced view passes through a structured parser, bounds,
validation, confidence logging, and engine approval.

## Optimization (primary: Mean-CVaR / multi-objective)

```
maximize:  expected_return
         - lambda_risk        * CVaR
         - lambda_turnover    * turnover
         - lambda_behavior    * behavioral_mismatch
         - lambda_abandonment * abandonment_risk

subject to: sum(weights)=1; weights>=0 (MVP); min cash; max per class;
            volatility limit; CVaR limit; expected-loss limit; min liquidity;
            user restrictions; transaction costs; financial capacity.
```

`abandonment_risk` = estimated chance the user sells/modifies during a hard scenario
(from revealed behavior + loss_aversion + liquidity_anxiety + declared-vs-revealed gap).

## Reference methods (compare ≥4)

Equal Weight, 60/40, Minimum Variance, Risk Parity, Mean-Variance, Mean-CVaR,
Black-Litterman, **Financial Twin Portfolio**.

## Two-layer portfolio

- **Strategic Portfolio** — long-term allocation from objectives, horizon, capacity.
- **Behavioral Buffer** — extra cash/liquidity, reduced classes that would trigger
  abandonment, concentration limits, reserve for unexpected events.

The portfolio must **not** collapse every anxious user to cash — it should find an
allocation the user can *maintain* without hurting the goals.

## Financial Twin Portfolio inputs

Financial constraints, `effective_risk_budget`, objectives, horizon, liquidity need,
simulated reactions, abandonment risk, consumption preferences, allowed classes,
scenario results, transaction costs. **Big Five only as a secondary variable.**

## Metrics

cumulative/annualized return, annualized volatility, Sharpe, Sortino, max drawdown,
VaR_95, CVaR_95, Calmar, downside deviation, turnover, transaction cost,
concentration index, liquidity score, probability_of_loss, probability_of_goal,
expected_shortfall, scenario_survival_rate.

Plus twin metrics: twin_profile_confidence, response_consistency,
behavioral_separation, persona_adherence, memory_influence, scenario_sensitivity,
strategy_abandonment_probability, risk_capacity_alignment,
declared_vs_revealed_risk_gap, source_dependence, behavioral_portfolio_fit.
