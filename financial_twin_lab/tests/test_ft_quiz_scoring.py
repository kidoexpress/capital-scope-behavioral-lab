"""Tests: quiz structure, reverse scoring, normalization, adaptive, scoring."""
from __future__ import annotations

from financial_twin_lab import QUIZ_VERSION
from financial_twin_lab.quiz import CORE_ITEMS, SCENARIOS, get_quiz_definition, select_adaptive
from financial_twin_lab.quiz.items import CORE_ITEMS_BY_ID
from financial_twin_lab.samples import make_sample_session
from financial_twin_lab.schemas.enums import BIG_FIVE
from financial_twin_lab.schemas.models import QuizResponse, FinancialContext
from financial_twin_lab.scoring import compute_scores, compute_triggers
from financial_twin_lab.scoring.engine import _normalize, score_dimensions


def test_core_has_32_items_and_reverse():
    assert len(CORE_ITEMS) == 32
    assert any(i.reverse_scored for i in CORE_ITEMS)
    assert len(SCENARIOS) == 10
    for s in SCENARIOS:
        assert 3 <= len(s.options) <= 5


def test_normalization_bounds():
    assert _normalize(1, False) == 0.0
    assert _normalize(5, False) == 1.0
    assert _normalize(3, False) == 0.5


def test_reverse_scoring_inverts():
    assert _normalize(5, True) == 0.0
    assert _normalize(1, True) == 1.0


def test_reverse_item_contributes_inverted():
    rev = next(i for i in CORE_ITEMS if i.reverse_scored)
    # a top Likert (5) on a reverse item should yield 0.0 for that dimension
    ds = score_dimensions([QuizResponse(rev.question_id, 5)])
    assert ds[rev.dimension].score == 0.0


def test_missing_responses_flag_low_confidence():
    # only answer 2 items -> most dimensions absent, answered dim has low n_items
    resp = [QuizResponse("B_loss", 4), QuizResponse("B_over", 2)]
    ds = score_dimensions(resp)
    assert ds["loss_aversion"].n_items == 1
    assert ds["loss_aversion"].confidence < 0.5


def test_big_five_scores_present():
    ctx, resp, scen = make_sample_session("balanced")
    sc = compute_scores(resp, scen, ctx)
    for d in BIG_FIVE:
        assert d in sc["big_five_scores"]


def test_scoring_version_stamped():
    ctx, resp, scen = make_sample_session("balanced")
    sc = compute_scores(resp, scen, ctx)
    assert sc["scoring_version"]


def test_capacity_caps_declared_tolerance():
    # high declared tolerance but very weak financial capacity
    ctx = FinancialContext(investable_assets=50000, emergency_reserve_months=1,
                           income_stability=0.3, liquidity_need=0.9,
                           investment_horizon_months=24, max_bearable_loss=0.05, dependents=3)
    fill = {"loss_aversion": 1, "liquidity_anxiety": 1, "reaction_to_losses": 1,
            "emotional_stability": 5}
    resp = [QuizResponse(it.question_id, fill.get(it.dimension, 3)) for it in CORE_ITEMS]
    _, _, scen = make_sample_session("aggressive")
    sc = compute_scores(resp, scen, ctx)
    assert sc["effective_risk_budget"] <= sc["risk_capacity_score"] + 1e-9
    assert sc["risk_tolerance_score"] > sc["risk_capacity_score"]  # divergence exists


def test_consistency_low_for_straight_lining():
    resp = [QuizResponse(it.question_id, 3) for it in CORE_ITEMS]  # all neutral
    ctx, _, scen = make_sample_session("balanced")
    sc = compute_scores(resp, scen, ctx)
    triggers = compute_triggers(sc, resp, scen)
    assert "straight_lining" in triggers


def test_adaptive_selection_capped():
    triggers = [f"low_confidence:d{i}" for i in range(20)] + ["declared_vs_revealed"]
    # only known dims map; result must never exceed the cap
    items = select_adaptive(triggers, max_adaptive=12)
    assert len(items) <= 12


def test_quiz_versioning():
    assert get_quiz_definition().version == QUIZ_VERSION
