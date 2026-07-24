"""Tests: portfolio metrics (return/vol/Sharpe/Sortino/drawdown/VaR/CVaR), fit."""
from __future__ import annotations

import numpy as np

from synthetic_portfolio_lab.assets import build_universe, universe_by_id
from synthetic_portfolio_lab.behavior import RuleBasedPersonaAgent
from synthetic_portfolio_lab.evaluation import (
    behavioral_portfolio_fit,
    behavioral_separation,
    evaluate_portfolio,
    path_metrics,
    scenario_metrics,
)
from synthetic_portfolio_lab.evaluation.fit import FitWeights
from synthetic_portfolio_lab.memory import MemoryStore, seed_memories
from synthetic_portfolio_lab.personas import all_personas, get_persona
from synthetic_portfolio_lab.portfolios import behavioral_scenario, equal_weight
from synthetic_portfolio_lab.scenarios import all_scenarios, normalize_probabilities

ASSETS = build_universe(seed=7, days=500)
ABYID = universe_by_id(ASSETS)
SCEN = normalize_probabilities(all_scenarios())
AGENT = RuleBasedPersonaAgent()


def test_path_metrics_keys_and_ranges():
    daily = np.random.default_rng(0).normal(0.0004, 0.01, size=300)
    m = path_metrics(daily)
    for k in ("cumulative_return", "annualized_return", "volatility", "sharpe_ratio",
              "sortino_ratio", "max_drawdown", "var_95", "cvar_95"):
        assert k in m
    assert m["volatility"] >= 0
    assert m["max_drawdown"] <= 0
    assert m["cvar_95"] <= m["var_95"] + 1e-9


def test_scenario_metrics_survival_and_var():
    p = get_persona("conservative_wealth_preserver")
    bs = behavioral_scenario(p, ASSETS, ABYID, SCEN, AGENT, MemoryStore(seed_memories(p)))
    sm = scenario_metrics(bs.weights, SCEN, ABYID, p)
    assert 0.0 <= sm["scenario_survival_rate"] <= 1.0
    assert sm["scenario_cvar_95"] <= sm["scenario_var_95"] + 1e-9
    assert sm["expected_drawdown"] >= 0.0


def test_fit_score_in_unit_interval():
    p = get_persona("conservative_wealth_preserver")
    store = MemoryStore(seed_memories(p))
    bs = behavioral_scenario(p, ASSETS, ABYID, SCEN, AGENT, store)
    ev = evaluate_portfolio(bs.weights, ABYID, SCEN, p, baseline=bs.weights)
    decisions = [AGENT.decide(p, {}, s, None, store.retrieve(p, s), None) for s in SCEN]
    fit = behavioral_portfolio_fit(p, bs.weights, ABYID, decisions,
                                   bs.constraint_violations, ev["scenario_dispersion"],
                                   ev["objective_alignment"])
    assert 0.0 <= fit["behavioral_portfolio_fit"] <= 1.0
    for k in ("persona_adherence", "risk_constraint_adherence", "liquidity_adherence",
              "behavioral_consistency", "scenario_stability", "objective_alignment"):
        assert 0.0 <= fit[k] <= 1.0


def test_fit_weights_configurable():
    p = get_persona("income_oriented_investor")
    store = MemoryStore(seed_memories(p))
    bs = behavioral_scenario(p, ASSETS, ABYID, SCEN, AGENT, store)
    ev = evaluate_portfolio(bs.weights, ABYID, SCEN, p, baseline=bs.weights)
    decisions = [AGENT.decide(p, {}, s, None, store.retrieve(p, s), None) for s in SCEN]
    default = behavioral_portfolio_fit(p, bs.weights, ABYID, decisions,
                                       bs.constraint_violations, ev["scenario_dispersion"],
                                       ev["objective_alignment"])
    custom = behavioral_portfolio_fit(p, bs.weights, ABYID, decisions,
                                      bs.constraint_violations, ev["scenario_dispersion"],
                                      ev["objective_alignment"],
                                      FitWeights(persona_adherence=1.0, risk_constraint_adherence=0.0,
                                                 liquidity_adherence=0.0, behavioral_consistency=0.0,
                                                 scenario_stability=0.0, objective_alignment=0.0))
    assert default["behavioral_portfolio_fit"] != custom["behavioral_portfolio_fit"]


def test_behavioral_portfolio_beats_or_matches_equal_weight_on_drawdown():
    """Conservative behavioral portfolio should not have worse drawdown than EW."""
    p = get_persona("conservative_wealth_preserver")
    store = MemoryStore(seed_memories(p))
    ew = equal_weight(p, ASSETS, ABYID)
    bs = behavioral_scenario(p, ASSETS, ABYID, SCEN, AGENT, store)
    ev_ew = evaluate_portfolio(ew.weights, ABYID, SCEN, p, baseline=ew.weights)
    ev_bs = evaluate_portfolio(bs.weights, ABYID, SCEN, p, baseline=ew.weights)
    assert ev_bs["max_drawdown"] >= ev_ew["max_drawdown"] - 1e-6  # less negative or equal


def test_behavioral_separation_beats_random():
    dbp = {}
    for p in all_personas():
        store = MemoryStore(seed_memories(p))
        dbp[p.persona_id] = [AGENT.decide(p, {}, s, None, store.retrieve(p, s), None) for s in SCEN]
    sep = behavioral_separation(dbp)
    assert sep["classification_accuracy"] > sep["random_baseline"]
