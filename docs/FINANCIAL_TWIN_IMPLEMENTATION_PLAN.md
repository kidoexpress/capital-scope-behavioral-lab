# Financial Twin — Implementation Plan & Migration

## Stack decision

Backend engine in **Python** package `financial_twin_lab/` (sibling of
`synthetic_portfolio_lab/` and `paper_trading/`), reusing numpy/scipy/pandas/sklearn
(LedoitWolf available) and pytest. Frontend (8 screens) reuses the React design
system. No LLM, no real orders, no future data in the MVP.

## Migration from Synthetic Portfolio Lab (no deletion now)

The current **Synthetic Portfolio Lab** (`synthetic_portfolio_lab/` + page
`/synthetic-portfolio-lab`) stays in place during the build. Plan:

1. Build `financial_twin_lab/` alongside it (no data loss, no deletion).
2. Add route `/financial-twin`; keep `/synthetic-portfolio-lab` as a **redirect** to
   `/financial-twin` (temporary) rather than deleting.
3. Only after the Financial Twin MVP is accepted, deprecate the old page.

### Reusable (import or adapt, don't rewrite)

| From Synthetic Portfolio Lab | Reuse in Financial Twin |
|---|---|
| `schemas/` dataclass + enum + `to_dict` pattern | new twin/quiz schemas follow it |
| `forecasting/` bootstrap, monte carlo, regime, eval, no-leakage split | extend with block bootstrap, Student-t, shrinkage |
| `optimization/constraints.py` (caps, min cash, normalize, concentration, liquidity) | reuse for portfolio constraints |
| `evaluation/portfolio_metrics.py` (Sharpe/Sortino/MDD/VaR/CVaR, scenario metrics) | reuse + add Calmar, downside dev, expected shortfall |
| `memory/retrieval.py` (configurable memory scoring) | adapt to twin memory (6 types) |
| `behavior/` agent interface + validation | adapt to twin action prediction (probabilities) |
| `repositories/json_store.py` | reuse for twin/quiz persistence + consent/deletion |
| `paper_trading/metrics.py` | formula conventions |

### To build new

Quiz engine (versioned items, adaptive, scoring), risk capacity/tolerance/revealed
split, twin profile + memory (6 types) + reflection-with-evidence, behavioral action
prediction with probabilities, expected-return models (shrinkage/BL/regime),
covariance (Ledoit-Wolf), Mean-CVaR/multi-objective optimizer with abandonment_risk
and two-layer (Strategic + Behavioral Buffer), block bootstrap + Student-t + regimes,
walk-forward backtest, consent/privacy (export/delete), 8 UI screens.

### Migrations

No existing user data to migrate (Synthetic lab is stateless per-run). Route redirect
is the only migration. New persistence starts fresh; all results carry version stamps.

## Package structure (planned)

```
financial_twin_lab/
  schemas/        quiz, financial_context, twin, memory, portfolio, forecast + enums
  quiz/           versioned items (32 core), adaptive rules, scenarios
  scoring/        deterministic scoring, risk capacity/tolerance/revealed, confidence
  twin/           profile builder, memory (6 types), retrieval, reflection
  behavior/       RuleBasedFinancialTwin (+ LLM/Hybrid interfaces, inactive)
  markets/        asset-class universe + seeded series
  returns/        ExpectedReturnModel impls (historical/shrunk/BL/regime)
  covariance/     Sample/EW/LedoitWolf
  portfolio/      reference methods + FinancialTwinPortfolio + two-layer
  optimization/   Mean-CVaR / multi-objective + constraints
  forecast/       bootstrap, block bootstrap, MC (Normal/Student-t), regimes, stress
  backtest/       walk-forward (no leakage)
  evaluation/     portfolio + twin metrics + behavioral_portfolio_fit
  explanations/   auditable, evidence-cited (question/scenario/constraint/memory IDs)
  privacy/        consent, export, deletion
  repositories/   JSON persistence (versioned)
  api_routes.py   /api/financial-twin/*
  cli.py          run flow end-to-end + JSON export
  tests/
```

## Phases (one at a time; test+lint+typecheck+commit each)

- **Phase 0** — inspection + these 6 docs (this commit).
- **Phase 1** — quiz + deterministic scoring + twin profile + persistence + tests + JSON.
- **Phase 2** — behavioral simulator: scenarios, memory, retrieval, rule reflection,
  action prediction (probabilities), consistency, tests. `RuleBasedFinancialTwin`
  first; `LLMFinancialTwin`/`HybridFinancialTwin` interfaces only (inactive).
- **Phase 3** — portfolio: class universe, shrinkage returns, Ledoit-Wolf covariance,
  EW/60-40/min-var/risk-parity/mean-CVaR/BL/FinancialTwin, constraints, metrics, tests.
- **Phase 4** — forecasting: bootstrap, block bootstrap, parametric MC (Student-t),
  rule regimes, 3/6/12m percentiles, prob of loss/goal, stress tests, walk-forward
  backtest, temporal-leakage tests.
- **Phase 5** — UI: 8 screens, reuse design system. Only after Phases 1–4 pass.

## Commits

1. docs: define Financial Twin product and research scope
2. feat: add versioned financial behavior quiz
3. feat: add deterministic financial twin scoring
4. feat: add financial twin memory and scenarios
5. feat: add portfolio estimation models
6. feat: add behavioral portfolio optimizer
7. feat: add probabilistic portfolio forecasting
8. feat: add financial twin user flow
9. test: cover Financial Twin end-to-end flow
10. docs: record MVP results and limitations

## Privacy

Consent versioned; no-save option; delete twin/responses; export; separation of
personal data vs results; data minimization; logs without sensitive responses;
configurable expiration. No full quiz sent to external services without consent; if
an external LLM is ever used, send only necessary context, preferably de-identified.

## Acceptance criteria (18)

See PRODUCT_SPEC §10. Key: quiz completes <10 min; multidimensional profile; declared
vs revealed vs capacity separated; twin reacts to ≥10 scenarios with probabilities;
class-based portfolio respecting all constraints; ≥4 methods compared; 3/6/12m
forecast with percentiles and prob of loss; stress tests; walk-forward backtest with
no temporal leakage; explanation cites which answers drove the portfolio; export/
delete; tests pass; **Capital Scope 2 original unchanged**; LLM never sets final
weights; returns never presented as guaranteed.
