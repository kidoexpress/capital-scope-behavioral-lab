"""Experiment runner — orchestrates the five engines and records everything.

Reproducible: the same ExperimentConfig (seed + params) yields the same result.
Builds one portfolio per persona (equal_weight, risk_based, persona_rule_based,
behavioral_scenario), evaluates each across the scenarios, computes the Behavioral
Portfolio Fit Score, and measures behavioral separation across personas.
"""
from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone

from .. import CODE_VERSION, MODEL_VERSION
from ..assets.universe import build_universe, universe_by_id
from ..behavior.agent import RuleBasedPersonaAgent
from ..evaluation.fit import behavioral_portfolio_fit
from ..evaluation.persona_metrics import (
    action_entropy,
    behavioral_separation,
    decision_consistency,
    memory_influence_score,
    risk_violation_rate,
    scenario_sensitivity,
    strategy_switch_rate,
)
from ..evaluation.portfolio_metrics import evaluate_portfolio
from ..memory.retrieval import MemoryStore, seed_memories
from ..personas.templates import PERSONA_TEMPLATES, get_persona
from ..portfolios.construction import (
    behavioral_scenario,
    equal_weight,
    persona_rule_based,
    risk_based,
)
from ..scenarios.templates import all_scenarios, get_scenario
from ..scenarios.engine import normalize_probabilities
from ..schemas import to_dict
from .config import ExperimentConfig

_EXPECTED_KEYS = (
    "annualized_return", "volatility", "sharpe_ratio", "sortino_ratio",
    "max_drawdown", "var_95", "cvar_95", "expected_scenario_return",
    "expected_drawdown", "scenario_survival_rate", "liquidity_score",
    "concentration", "turnover", "objective_alignment",
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_experiment(config: ExperimentConfig) -> dict:
    assets = build_universe(config.universe_seed, config.universe_days)
    abyid = universe_by_id(assets)
    scenarios = normalize_probabilities(
        [get_scenario(k) for k in config.scenario_keys]
        if config.scenario_keys else all_scenarios()
    )
    agent = RuleBasedPersonaAgent()
    persona_keys = config.persona_keys or list(PERSONA_TEMPLATES)
    personas = [get_persona(k) for k in persona_keys]

    per_persona: list[dict] = []
    decisions_by_persona: dict[str, list] = {}
    all_violations: list[list[str]] = []

    for p in personas:
        store = MemoryStore(seed_memories(p) if config.use_memory else [])
        no_mem_store = MemoryStore([])
        decisions = [agent.decide(p, {}, s, None, store.retrieve(p, s), config.intervention)
                     for s in scenarios]
        decisions_no_mem = [agent.decide(p, {}, s, None, no_mem_store.retrieve(p, s), config.intervention)
                            for s in scenarios]
        decisions_by_persona[p.persona_id] = decisions

        candidates = {
            "equal_weight": equal_weight(p, assets, abyid),
            "risk_based": risk_based(p, assets, abyid),
            "persona_rule_based": persona_rule_based(p, assets, abyid),
            "behavioral_scenario": behavioral_scenario(
                p, assets, abyid, scenarios, agent, store, config.intervention),
        }
        baseline = candidates["equal_weight"].weights
        portfolios: dict[str, dict] = {}
        for method, cand in candidates.items():
            metrics = evaluate_portfolio(cand.weights, abyid, scenarios, p, baseline=baseline)
            all_violations.append(cand.constraint_violations)
            portfolios[method] = {
                "portfolio_id": cand.portfolio_id,
                "weights": cand.weights,
                "constraint_violations": cand.constraint_violations,
                "metrics": {k: round(metrics[k], 6) for k in _EXPECTED_KEYS if k in metrics},
                "scenario_results": cand.scenario_results,
                "explanation": cand.explanation,
            }

        bs = candidates["behavioral_scenario"]
        bs_metrics = evaluate_portfolio(bs.weights, abyid, scenarios, p, baseline=baseline)
        fit = behavioral_portfolio_fit(
            p, bs.weights, abyid, decisions, bs.constraint_violations,
            bs_metrics["scenario_dispersion"], bs_metrics["objective_alignment"],
            config.fit_weights,
        )

        per_persona.append({
            "persona_id": p.persona_id,
            "persona": to_dict(p),
            "decisions": [to_dict(d) for d in decisions],
            "portfolios": portfolios,
            "behavioral_portfolio_fit": {k: round(v, 4) for k, v in fit.items()},
            "persona_metrics": {
                "action_entropy": round(action_entropy(decisions), 4),
                "decision_consistency": round(decision_consistency(decisions), 4),
                "strategy_switch_rate": round(strategy_switch_rate(decisions), 4),
                "scenario_sensitivity": round(scenario_sensitivity(decisions), 4),
                "memory_influence_score": round(
                    memory_influence_score(decisions, decisions_no_mem), 4),
            },
        })

    separation = behavioral_separation(decisions_by_persona)

    return {
        "reproducibility": {
            "experiment_id": config.experiment_id,
            "seed": config.seed,
            "code_version": CODE_VERSION,
            "model_version": MODEL_VERSION,
            "created_at": _now(),
            "config": asdict(config),
            "asset_universe": [a.asset_id for a in assets],
            "data_period_days": config.universe_days,
            "scenarios": [{"scenario_id": s.scenario_id, "probability": round(s.probability, 4)}
                          for s in scenarios],
            "personas": persona_keys,
        },
        "results": per_persona,
        "behavioral_separation": separation,
        "aggregate": {
            "risk_violation_rate": round(risk_violation_rate(all_violations), 4),
            "num_personas": len(personas),
            "num_scenarios": len(scenarios),
        },
    }
