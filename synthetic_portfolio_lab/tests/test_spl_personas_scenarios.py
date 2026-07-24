"""Tests: personas, traits, memory, scenarios, probabilities, seeded generation."""
from __future__ import annotations

from synthetic_portfolio_lab.behavior import RuleBasedPersonaAgent
from synthetic_portfolio_lab.memory import MemoryStore, seed_memories
from synthetic_portfolio_lab.personas import all_personas, get_persona
from synthetic_portfolio_lab.scenarios import (
    ScenarioEngine,
    all_scenarios,
    normalize_probabilities,
    probabilities_sum,
)
from synthetic_portfolio_lab.scenarios.engine import ScenarioEngine as SE


def test_six_personas_created():
    ps = all_personas()
    assert len(ps) == 6
    assert len({p.persona_id for p in ps}) == 6


def test_persona_traits_within_bounds():
    for p in all_personas():
        t = p.behavioral_traits
        for name in ("risk_tolerance", "loss_aversion", "overconfidence",
                     "herding", "ambiguity_aversion", "advisor_trust", "ai_trust"):
            assert 0.0 <= getattr(t, name) <= 1.0
        assert -1.0 <= t.trend_sensitivity <= 1.0


def test_contrarian_has_negative_trend_sensitivity():
    assert get_persona("contrarian_investor").behavioral_traits.trend_sensitivity < 0
    assert get_persona("trend_following_growth_investor").behavioral_traits.trend_sensitivity > 0


def test_ten_scenarios_and_probability_sum():
    sc = all_scenarios()
    assert len(sc) == 10
    normalize_probabilities(sc)
    assert abs(probabilities_sum(sc) - 1.0) < 1e-9


def test_probability_normalization_handles_arbitrary_values():
    sc = all_scenarios()
    for i, s in enumerate(sc):
        s.probability = float(i + 1)
    normalize_probabilities(sc)
    assert abs(probabilities_sum(sc) - 1.0) < 1e-9


def test_monte_carlo_seeded_reproducible():
    eng = ScenarioEngine()
    a = eng.monte_carlo(n=8, seed=123)
    b = eng.monte_carlo(n=8, seed=123)
    assert [s.shocks.equity_return for s in a] == [s.shocks.equity_return for s in b]
    c = eng.monte_carlo(n=8, seed=124)
    assert [s.shocks.equity_return for s in a] != [s.shocks.equity_return for s in c]


def test_user_defined_scenario_validates_regime():
    eng = SE()
    s = eng.user_defined("u1", "Custom", "d", 90, 0.2, "risk_off",
                         {"equity_return": -0.1})
    assert s.source_type == "user_defined"
    assert s.shocks.equity_return == -0.1


def test_memory_retrieval_respects_length():
    p = get_persona("conservative_wealth_preserver")
    p.memory_config.memory_length = 2
    store = MemoryStore(seed_memories(p))
    scen = get_persona  # placeholder not used
    from synthetic_portfolio_lab.scenarios import get_scenario
    mems = store.retrieve(p, get_scenario("bear_market"))
    assert len(mems) <= 2


def test_memory_disabled_returns_empty():
    p = get_persona("conservative_wealth_preserver")
    p.memory_config.enabled = False
    store = MemoryStore(seed_memories(p))
    from synthetic_portfolio_lab.scenarios import get_scenario
    assert store.retrieve(p, get_scenario("bear_market")) == []


def test_personas_produce_different_decisions():
    from synthetic_portfolio_lab.scenarios import get_scenario
    agent = RuleBasedPersonaAgent()
    bear = get_scenario("bear_market")
    actions = set()
    for p in all_personas():
        store = MemoryStore(seed_memories(p))
        d = agent.decide(p, {}, bear, None, store.retrieve(p, bear), None)
        actions.add(d.action)
    assert len(actions) >= 2  # behavioral separation
