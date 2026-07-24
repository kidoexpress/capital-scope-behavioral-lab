# Synthetic Portfolio Lab — Data Model

Fase 1 usa **persistência mínima** (repositório JSON, espelhando o padrão de
`paper_trading/repository.py`). SQLite/API ficam para fases posteriores. As
entidades abaixo são materializadas como `@dataclass` em `schemas/`.

## Entidades

| Entidade | Campos-chave |
|---|---|
| **Asset** | asset_id, symbol, asset_class, expected_return, volatility, liquidity, risk_score, currency, sector, historical_series, allowed_personas, minimum_weight, maximum_weight |
| **Persona** | persona_id, name, demographics, financial_profile, behavioral_traits, objectives, constraints, dynamic_state, memory_config |
| **PersonaTraits** | risk_tolerance, loss_aversion, trend_sensitivity, overconfidence, herding, ambiguity_aversion, need_for_control, advisor_trust, ai_trust |
| **PersonaConstraints** | minimum_cash_weight, maximum_equity_weight, maximum_single_asset_weight, maximum_expected_drawdown, restricted_assets |
| **PersonaState** (dynamic) | stress, confidence, recent_loss, recent_gain, current_strategy |
| **Memory** | memory_id, persona_id, type(episodic/semantic/decision/outcome/relational), content, created_at, importance, emotional_valence, reliability, related_assets, related_scenarios, supporting_event_ids |
| **Scenario** | scenario_id, name, description, horizon_days, probability, market_regime, shocks, assumptions, source_type, severity, confidence, created_at, generation_method, model_version, seed |
| **ScenarioShocks** | interest_rate_change, inflation_change, equity_return, bond_return, commodity_return, fx_change, volatility_change |
| **Forecast** | asset_id, horizon_days, expected_return, median_return, volatility, downside_probability, quantiles(p05..p95), confidence, method, assumptions, model_version |
| **BehavioralDecision** | persona_id, scenario_id, action, target_assets, allocation_changes, confidence, request_human_review, reason_codes, memories_used, expected_behavioral_effect |
| **PortfolioCandidate** | portfolio_id, persona_id, method, weights, expected_metrics, behavioral_metrics, constraint_violations, scenario_results |
| **PortfolioEvaluation** | per-scenario + aggregate metrics (return/vol/Sharpe/Sortino/MDD/VaR/CVaR/turnover/concentration/liquidity/fit) |
| **ExperimentRun** | run_id, seed, code_version, model_version, params, asset_universe, data_period, scenarios, personas, config, results |
| **AuditEvent** | event_id, run_id, timestamp, kind, payload (IDs of decisions/scenarios/constraints) |

## Registro de cada decisão (trilha de auditoria)

```
experiment_run_id, persona_id, scenario_id, timestamp, input_market_state,
portfolio_before, memories_used, intervention, proposed_action,
validation_result, final_action, portfolio_after, reason_codes,
model_name, prompt_version, seed
```

## Enumerações

- **Ações:** BUY, SELL, HOLD, INCREASE_RISK, REDUCE_RISK, MOVE_TO_CASH, REBALANCE,
  REQUEST_HUMAN_REVIEW, REQUEST_MORE_INFORMATION.
- **Scenario source_type:** user_defined, historical_replay, rule_based,
  statistical, model_generated, hybrid.
- **Market regime:** bull, bear, sideways, high_volatility, low_volatility,
  risk_on, risk_off.
- **Memory type:** episodic, semantic, decision, outcome, relational.
- **Portfolio method:** equal_weight, risk_based, persona_rule_based,
  behavioral_scenario.
- **Asset class:** equity, fixed_income, etf, commodity, cash.

## Validações obrigatórias (motor determinístico)

Pesos ∈ [0,1]; Σ pesos = 1 (tolerância numérica); ativos permitidos; limites
min/max por ativo; maximum_single_asset_weight; minimum_cash_weight;
maximum_equity_weight; concentração; liquidez; coerência do schema; probabilidades
de cenários somam 1 (normalizadas).
