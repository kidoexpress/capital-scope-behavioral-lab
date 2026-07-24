"""Tests: behavioral decisions, portfolio constraints, weights, concentration."""
from __future__ import annotations

from synthetic_portfolio_lab.assets import build_universe, universe_by_id
from synthetic_portfolio_lab.behavior import RuleBasedPersonaAgent, validate_decision
from synthetic_portfolio_lab.memory import MemoryStore, seed_memories
from synthetic_portfolio_lab.optimization import concentration, equity_weight, liquidity_score
from synthetic_portfolio_lab.personas import all_personas, get_persona
from synthetic_portfolio_lab.portfolios import (
    behavioral_scenario,
    equal_weight,
    persona_rule_based,
    risk_based,
)
from synthetic_portfolio_lab.scenarios import all_scenarios, get_scenario, normalize_probabilities

ASSETS = build_universe(seed=7, days=400)
ABYID = universe_by_id(ASSETS)
SCEN = normalize_probabilities(all_scenarios())
AGENT = RuleBasedPersonaAgent()


def test_decision_is_valid():
    p = get_persona("conservative_wealth_preserver")
    store = MemoryStore(seed_memories(p))
    d = AGENT.decide(p, {}, get_scenario("bear_market"), None, store.retrieve(p, get_scenario("bear_market")), None)
    assert validate_decision(d).valid
    assert d.action in {"BUY", "SELL", "HOLD", "INCREASE_RISK", "REDUCE_RISK",
                        "MOVE_TO_CASH", "REBALANCE", "REQUEST_HUMAN_REVIEW",
                        "REQUEST_MORE_INFORMATION"}


def test_allocation_changes_net_to_zero():
    p = get_persona("trend_following_growth_investor")
    store = MemoryStore(seed_memories(p))
    d = AGENT.decide(p, {}, get_scenario("bull_market"), None, store.retrieve(p, get_scenario("bull_market")), None)
    if d.allocation_changes:
        assert abs(sum(d.allocation_changes.values())) < 1e-3


def _all_methods(p):
    store = MemoryStore(seed_memories(p))
    return [
        equal_weight(p, ASSETS, ABYID),
        risk_based(p, ASSETS, ABYID),
        persona_rule_based(p, ASSETS, ABYID),
        behavioral_scenario(p, ASSETS, ABYID, SCEN, AGENT, store),
    ]


def test_weights_sum_to_one_all_methods_all_personas():
    for p in all_personas():
        for cand in _all_methods(p):
            s = sum(cand.weights.values())
            assert abs(s - 1.0) < 1e-6, (p.persona_id, cand.method, s)


def test_constraints_respected():
    for p in all_personas():
        for cand in _all_methods(p):
            assert cand.constraint_violations == [], (p.persona_id, cand.method)
            eq = equity_weight(cand.weights, ABYID)
            assert eq <= p.constraints.maximum_equity_weight + 1e-3
            assert cand.weights.get("CASH", 0.0) >= p.constraints.minimum_cash_weight - 1e-3
            for aid, w in cand.weights.items():
                if aid == "CASH":
                    continue  # cash is exempt from the single-asset cap
                cap = min(p.constraints.maximum_single_asset_weight, ABYID[aid].maximum_weight)
                assert w <= cap + 1e-3


def test_restricted_assets_excluded():
    p = get_persona("long_term_fundamentalist")
    p.constraints.restricted_assets = ["EQ_TSLA", "CM_USO"]
    cand = persona_rule_based(p, ASSETS, ABYID)
    assert cand.weights.get("EQ_TSLA", 0.0) < 1e-6
    assert cand.weights.get("CM_USO", 0.0) < 1e-6


def test_concentration_and_liquidity_ranges():
    p = get_persona("high_confidence_concentrated_investor")
    cand = behavioral_scenario(p, ASSETS, ABYID, SCEN, AGENT, MemoryStore(seed_memories(p)))
    assert 0.0 < concentration(cand.weights) <= 1.0
    assert 0.0 <= liquidity_score(cand.weights, ABYID) <= 1.0


def test_personas_produce_different_portfolios():
    cons = behavioral_scenario(get_persona("conservative_wealth_preserver"),
                               ASSETS, ABYID, SCEN, AGENT,
                               MemoryStore(seed_memories(get_persona("conservative_wealth_preserver"))))
    conc = behavioral_scenario(get_persona("high_confidence_concentrated_investor"),
                               ASSETS, ABYID, SCEN, AGENT,
                               MemoryStore(seed_memories(get_persona("high_confidence_concentrated_investor"))))
    assert equity_weight(cons.weights, ABYID) < equity_weight(conc.weights, ABYID)
