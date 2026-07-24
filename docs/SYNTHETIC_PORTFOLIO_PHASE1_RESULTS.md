# Synthetic Portfolio Lab — Phase 1 Results

Isolated Python package `synthetic_portfolio_lab/` (sibling of `paper_trading/`).
No UI, no LLM, no real-time data, no real orders. All results are simulated
hypotheses over possible future states — not predictions or financial advice.

## What was built

| Engine | Module | Status |
|---|---|---|
| Schemas | `schemas/` | dataclasses + enums + JSON `to_dict` |
| Assets | `assets/` | 18-asset controlled universe, seeded series |
| Scenario Engine | `scenarios/` | 10 templates + user/historical/rule/monte_carlo |
| Persona Engine | `personas/`, `memory/` | 6 templates + 5 memory types + retrieval |
| Behavioral Decision Engine | `behavior/` | `RuleBasedPersonaAgent` + validation |
| Forecasting | `forecasting/` | 5 distributional baselines + regime + eval |
| Portfolio Construction | `portfolios/`, `optimization/` | 4 methods + constraints |
| Evaluation & Explanation | `evaluation/`, `explanations/` | metrics + fit + audit |
| Experiments / CLI | `experiments/`, `repositories/`, `cli.py` | runner + JSON export |

## Acceptance criteria (Phase 1)

| # | Criterion | Status |
|---|---|---|
| 1 | Six personas | ✅ |
| 2 | Multiple scenarios | ✅ (10 templates + generators) |
| 3 | Scenario probabilities | ✅ (normalized to 1) |
| 4 | Rule-based decisions | ✅ |
| 5 | Different personas → different decisions | ✅ (separation 0.50 vs 0.167 random on 6 personas) |
| 6 | One portfolio per persona | ✅ (4 methods) |
| 7 | Weights sum to 100% | ✅ (tested all methods/personas) |
| 8 | Constraints respected | ✅ (0 violations) |
| 9 | Portfolio evaluated across scenarios | ✅ |
| 10 | Comparison vs equal weight | ✅ |
| 11 | Basic metrics | ✅ (return/vol/Sharpe/Sortino/MDD/VaR/CVaR + fit) |
| 12 | Replay with same seed | ✅ (identical JSON) |
| 13 | JSON export | ✅ |
| 14 | Tests pass | ✅ (33 SPL + 10 existing = 43) |
| 15 | No real LLM calls | ✅ |
| 16 | No real orders | ✅ |
| 17 | Existing Capital Scope still works | ✅ (frontend build + pytest green) |

## Example run

`docs/examples/phase1_example_run.json` — Experiment 1 (market-drop context):
conservative vs trend vs contrarian over bear/base/liquidity scenarios.
Behavioral separation accuracy 0.78 vs 0.33 random; conservative fit 0.75.

Regenerate:

```bash
python -m synthetic_portfolio_lab.cli run \
  --personas conservative_wealth_preserver,trend_following_growth_investor,contrarian_investor \
  --scenarios bear_market,base_case,liquidity_crisis \
  --seed 42 --out docs/examples/phase1_example_run.json
```

## How to run

```bash
python -m synthetic_portfolio_lab.cli list          # templates
python -m synthetic_portfolio_lab.cli run --seed 42 --out results.json
python -m pytest synthetic_portfolio_lab/tests -q    # tests
```

## Observations on the hypotheses (illustrative, not conclusive)

- **H2** (different personas → different allocations): confirmed — equity weight
  ranges 0.29 (conservative) to 0.88 (concentrated); contrarian buys the dip while
  conservative/income de-risk on a −15% shock.
- **H3** (negative shocks compress differences): consistent — on adverse scenarios
  several personas converge to defensive actions, lowering separation.
- **H1** (memory changes decisions): the rule agent applies a memory bias;
  `memory_influence_score` is reported per persona (nonzero when seed memories flip
  an action or tilt).

## Limitations (Phase 1)

- Asset return series are **simulated** (seeded Normal), not real market data.
- Portfolio risk uses a simplified covariance (per-asset vol; correlation only via
  shared class shocks in scenario returns). No full covariance matrix yet.
- Scenario returns are class-level (equity/bond/commodity/cash); no per-asset
  idiosyncratic scenario response.
- Rule agent is intentionally simple and hand-tuned; weights/thresholds are MVP.
- Fit-score weights are an initial proposal (configurable), not validated.
- No Python static type checker configured (compileall + tests only).

## What Phase 2 adds (not in this phase)

- React UI at `/synthetic-portfolio-lab` (5 steps), charts, interactive creation,
  scenario comparison, visual replay, CSV export, experiment history.
- FastAPI endpoints under `/api/synthetic-portfolio/*`.

Phase 3 (LLM agents, semantic memory, embeddings, model-generated explanations)
and Phase 4 (HMM/regime models, multi-objective optimization, external data,
larger historical studies) remain out of scope.
