"""Build the synthetic Financial Twin profile from context + scored responses.

Deterministic: the same inputs (and versions) always produce the same profile.
This is an ESTIMATED representation, not a perfect copy.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import numpy as np

from .. import PROFILE_VERSION, QUIZ_VERSION
from ..schemas.models import (
    DecisionStyle,
    FinancialContext,
    ProfileConfidence,
    QuizItem,
    QuizResponse,
    RiskProfile,
    ScenarioResponse,
    TwinProfile,
)
from ..scoring.config import RiskWeights
from ..scoring.engine import compute_scores


def _primary_style(scores: dict) -> str:
    fin = scores["financial_behavior_scores"]
    inv = scores["investment_behavior_scores"]
    budget = scores["effective_risk_budget"]
    if budget < 0.35 and fin.get("loss_aversion", 0.5) >= 0.6:
        return "cautious_adaptive"
    if fin.get("overconfidence", 0.4) >= 0.65 and fin.get("advisor_trust", 0.5) < 0.45:
        return "independent_assertive"
    if fin.get("herding", 0.3) >= 0.6:
        return "social_follower"
    if inv.get("strategy_commitment", 0.5) >= 0.65 and scores["response_consistency_score"] >= 0.6:
        return "disciplined"
    return "balanced"


def build_twin_profile(
    user_id: str,
    context: FinancialContext,
    responses: list[QuizResponse],
    scenario_responses: list[ScenarioResponse],
    twin_id: str | None = None,
    weights: RiskWeights | None = None,
    extra_items: dict[str, QuizItem] | None = None,
) -> tuple[TwinProfile, dict]:
    scores = compute_scores(responses, scenario_responses, context, weights, extra_items)

    bf = scores["big_five_scores"]
    fin = scores["financial_behavior_scores"]
    inv = scores["investment_behavior_scores"]

    stress = float(np.mean([
        fin.get("loss_aversion", 0.5),
        1.0 - bf.get("emotional_stability", 0.5),
        fin.get("liquidity_anxiety", 0.5),
    ]))

    decision_style = DecisionStyle(
        primary_style=_primary_style(scores),
        advisor_dependence=fin.get("advisor_trust", 0.5),
        ai_trust=fin.get("ai_trust", 0.4),
        monitoring_frequency="weekly" if inv.get("reaction_to_losses", 0.5) >= 0.6 else "monthly",
        stress_sensitivity=round(stress, 4),
    )

    risk_profile = RiskProfile(
        risk_capacity=scores["risk_capacity_score"],
        risk_tolerance=scores["risk_tolerance_score"],
        revealed_risk_behavior=scores["revealed_risk_behavior_score"],
        effective_risk_budget=scores["effective_risk_budget"],
        declared_vs_revealed_gap=scores["declared_vs_revealed_gap"],
    )

    profile = TwinProfile(
        twin_id=twin_id or f"twin_{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        profile_version=PROFILE_VERSION,
        quiz_version=QUIZ_VERSION,
        scoring_version=scores["scoring_version"],
        financial_context=context,
        personality=bf,
        behavioral_traits=fin,
        consumption_traits=scores["consumption_behavior_scores"],
        investing_traits=inv,
        risk_profile=risk_profile,
        decision_style=decision_style,
        confidence=ProfileConfidence(
            overall=scores["profile_confidence_score"],
            low_confidence_dimensions=scores["low_confidence_dimensions"],
        ),
        response_consistency=scores["response_consistency_score"],
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    return profile, scores
