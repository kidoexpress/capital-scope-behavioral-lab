"""Compute adaptive-question triggers from scored responses (deterministic)."""
from __future__ import annotations

from ..schemas.models import QuizResponse, ScenarioResponse

_LOW_CONF_DIMS = {
    "ai_trust", "advisor_trust", "herding", "loss_aversion",
    "liquidity_anxiety", "strategy_commitment", "reaction_to_losses", "overconfidence",
}


def compute_triggers(
    scores: dict,
    responses: list[QuizResponse],
    scenario_responses: list[ScenarioResponse],
) -> list[str]:
    triggers: list[str] = []

    if abs(scores.get("declared_vs_revealed_gap", 0.0)) > 0.25:
        triggers.append("declared_vs_revealed")

    values = [r.value for r in responses]
    if values and len(set(values)) == 1:
        triggers.append("straight_lining")

    if scores.get("risk_tolerance_score", 0.5) > scores.get("risk_capacity_score", 0.5) + 0.2:
        triggers.append("tolerance_capacity_gap")

    fin = scores.get("financial_behavior_scores", {})
    if fin.get("herding", 0.0) > 0.6:
        triggers.append("high_herding")

    if scores.get("response_consistency_score", 1.0) < 0.5:
        triggers.append("low_consistency")

    # source dependence: AI vs human recommendation choices differ
    by_id = {sr.scenario_id: sr for sr in scenario_responses}
    ai, hu = by_id.get("ai_recommendation"), by_id.get("human_recommendation")
    if ai and hu and ai.choice != hu.choice:
        triggers.append("source_dependence")

    for dim in sorted(scores.get("low_confidence_dimensions", [])):
        if dim in _LOW_CONF_DIMS:
            triggers.append(f"low_confidence:{dim}")

    return triggers
