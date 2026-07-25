"""Deterministic sample quiz sessions for CLI demos and tests (no real users)."""
from __future__ import annotations

from .quiz.items import CORE_ITEMS
from .quiz.scenarios import SCENARIOS
from .schemas.models import FinancialContext, QuizResponse, ScenarioResponse

# dimension -> Likert value; anything unset defaults to 3 (neutral).
_PROFILES: dict[str, dict] = {
    "cautious": {
        "fill": {"loss_aversion": 5, "liquidity_anxiety": 5, "emotional_stability": 2,
                 "reaction_to_losses": 5, "strategy_commitment": 2, "future_orientation": 5,
                 "advisor_trust": 4, "ai_trust": 2, "savings_discipline": 4},
        "scenario_choice": "B",  # de-risk
        "context": dict(investable_assets=120000, emergency_reserve_months=3,
                        income_stability=0.5, liquidity_need=0.6,
                        investment_horizon_months=60, max_bearable_loss=0.12, dependents=1),
    },
    "aggressive": {
        "fill": {"loss_aversion": 1, "liquidity_anxiety": 1, "emotional_stability": 5,
                 "reaction_to_losses": 1, "overconfidence": 5, "strategy_commitment": 5,
                 "ai_trust": 4, "herding": 2},
        "scenario_choice": "D",  # add risk
        "context": dict(investable_assets=1_500_000, emergency_reserve_months=12,
                        income_stability=0.9, liquidity_need=0.1,
                        investment_horizon_months=240, max_bearable_loss=0.45, dependents=0),
    },
    "balanced": {
        "fill": {"loss_aversion": 3, "emotional_stability": 3, "strategy_commitment": 4,
                 "savings_discipline": 4, "advisor_trust": 3, "ai_trust": 3},
        "scenario_choice": "C",  # hold
        "context": dict(investable_assets=400000, emergency_reserve_months=6,
                        income_stability=0.7, liquidity_need=0.3,
                        investment_horizon_months=120, max_bearable_loss=0.25, dependents=1),
    },
}


def make_sample_session(kind: str = "balanced") -> tuple[FinancialContext, list[QuizResponse], list[ScenarioResponse]]:
    if kind not in _PROFILES:
        raise KeyError(f"unknown sample profile: {kind}")
    spec = _PROFILES[kind]
    fill = spec["fill"]
    responses = [QuizResponse(it.question_id, fill.get(it.dimension, 3)) for it in CORE_ITEMS]
    choice = spec["scenario_choice"]
    scen_responses = []
    for s in SCENARIOS:
        keys = [o.key for o in s.options]
        pick = choice if choice in keys else keys[min(1, len(keys) - 1)]
        scen_responses.append(ScenarioResponse(s.scenario_id, pick, intensity=0.6, confidence=0.7))
    context = FinancialContext(**spec["context"])
    return context, responses, scen_responses


SAMPLE_KINDS = tuple(_PROFILES)
