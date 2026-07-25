# Financial Twin — Scoring Spec

All scores are computed by **deterministic code** (no LLM). Weights are configurable
and every result records the `scoring_version`.

## Pipeline

1. Normalize each Likert item to [0, 1]: `(value - 1) / 4`.
2. Apply reverse scoring: `1 - normalized` for `reverse_scored` items.
3. Dimension score = mean of its items.
4. Consistency adjustment (see below).
5. Scenario-response adjustment (revealed behavior).
6. Confidence interval + insufficient-data flag per dimension.

## Computed outputs

`big_five_scores`, `financial_behavior_scores`, `consumption_behavior_scores`,
`investment_behavior_scores`, `risk_capacity_score`, `risk_tolerance_score`,
`revealed_risk_behavior_score`, `response_consistency_score`,
`profile_confidence_score`.

## Risk capacity vs tolerance vs behavior

- **RISK CAPACITY** — how much risk the financial situation allows (objective:
  investable assets, income stability, emergency reserve, horizon, liquidity need,
  dependents, debt cost, max financially bearable loss).
- **RISK TOLERANCE** — how much risk the user *declares* accepting (quiz items).
- **REVEALED RISK BEHAVIOR** — how much risk the user *demonstrates* in concrete
  scenario decisions.

**Declared tolerance may never exceed the financial capacity limit.**

## Initial risk weighting (configurable)

```
declared_risk = 0.35 * risk_tolerance_score
              + 0.45 * revealed_risk_behavior_score
              + 0.20 * emotional_stability_adjustment

effective_risk_budget = min(declared_risk, risk_capacity_limit)
```

Personality never substitutes financial capacity.

## Consistency & confidence

- `response_consistency_score`: agreement between paired/reverse items and between
  declared vs revealed (scenario) behavior; penalize straight-lining.
- `profile_confidence_score`: function of item coverage per dimension, consistency,
  and response-time sanity. Dimensions with too few items or high variance are
  flagged `insufficient_data` (surfaced as "dados insuficientes", never a hard label).

## Declared vs revealed gap

`declared_vs_revealed_risk_gap = risk_tolerance_score - revealed_risk_behavior_score`
— a key driver of the Behavioral Buffer in the portfolio engine.

## Risk capacity limit (documented heuristic, configurable)

Derived from: emergency-reserve months, income stability, horizon, liquidity need,
dependents and max bearable loss. Higher reserve/stability/horizon → higher limit;
higher liquidity need/dependents/short horizon → lower limit. Output in [0, 1].

## Scenario → revealed behavior mapping

Each scenario option maps to a risk-behavior value in [0, 1] (e.g. market-drop:
SELL=0.0, PARTIAL_DE_RISK=0.35, HOLD=0.6, BUY=1.0, REQUEST_REVIEW=0.45), weighted by
`intensity`/`confidence`. `revealed_risk_behavior_score` = weighted mean across the
10 scenarios.
