"""Deterministic scoring engine (no LLM).

Turns quiz responses + scenario responses + financial context into a
multidimensional profile: Big Five, behavioral/consumption/investing dimensions,
risk capacity vs tolerance vs revealed behavior, consistency and confidence.
Every weight is configurable and stamped with a version.
"""
from __future__ import annotations

import numpy as np

from ..quiz.items import CORE_ITEMS_BY_ID
from ..quiz.scenarios import SCENARIOS_BY_ID
from ..schemas.enums import (
    BIG_FIVE,
    CONSUMPTION_DIMS,
    FINANCIAL_BEHAVIOR_DIMS,
    INVESTING_DIMS,
    LIKERT_MAX,
    LIKERT_MIN,
)
from ..schemas.models import (
    DimensionScore,
    FinancialContext,
    QuizItem,
    QuizResponse,
    ScenarioResponse,
)
from .config import RiskWeights


def _normalize(value: int, reverse: bool) -> float:
    v = (value - LIKERT_MIN) / (LIKERT_MAX - LIKERT_MIN)
    return 1.0 - v if reverse else v


def _confidence_from(n_items: int, values: list[float]) -> float:
    base = {0: 0.0, 1: 0.45, 2: 0.6, 3: 0.72}.get(n_items, 0.85)
    if len(values) > 1:
        # lower spread -> higher confidence
        base *= float(1.0 - min(0.5, np.std(values)))
    return round(min(1.0, base), 4)


def score_dimensions(
    responses: list[QuizResponse],
    extra_items: dict[str, QuizItem] | None = None,
) -> dict[str, DimensionScore]:
    """Mean normalized (reverse-adjusted) value per dimension."""
    item_lookup = dict(CORE_ITEMS_BY_ID)
    if extra_items:
        item_lookup.update(extra_items)

    by_dim: dict[str, list[float]] = {}
    for r in responses:
        item = item_lookup.get(r.question_id)
        if item is None:
            continue
        by_dim.setdefault(item.dimension, []).append(_normalize(r.value, item.reverse_scored))

    scores: dict[str, DimensionScore] = {}
    for dim, vals in by_dim.items():
        scores[dim] = DimensionScore(
            dimension=dim,
            score=round(float(np.mean(vals)), 4),
            n_items=len(vals),
            confidence=_confidence_from(len(vals), vals),
            insufficient_data=len(vals) == 0,
        )
    return scores


def _get(scores: dict[str, DimensionScore], dim: str, default: float = 0.5) -> float:
    ds = scores.get(dim)
    return ds.score if ds else default


def revealed_risk_behavior(scenario_responses: list[ScenarioResponse]) -> tuple[float, float]:
    """Weighted mean of chosen options' risk_behavior. Returns (score, confidence)."""
    if not scenario_responses:
        return 0.5, 0.0
    vals, weights = [], []
    for sr in scenario_responses:
        scen = SCENARIOS_BY_ID.get(sr.scenario_id)
        if not scen:
            continue
        opt = next((o for o in scen.options if o.key == sr.choice), None)
        if not opt:
            continue
        vals.append(opt.risk_behavior)
        weights.append(max(0.1, 0.5 + 0.5 * sr.confidence))
    if not vals:
        return 0.5, 0.0
    score = float(np.average(vals, weights=weights))
    conf = round(min(0.9, 0.3 + 0.06 * len(vals)), 4)
    return round(score, 4), conf


def risk_capacity(context: FinancialContext) -> float:
    """Documented heuristic in [0,1]: how much risk the situation allows."""
    reserve = min(1.0, context.emergency_reserve_months / 12.0)
    stability = context.income_stability
    horizon = min(1.0, context.investment_horizon_months / 240.0)
    liquidity = 1.0 - context.liquidity_need
    dependents = max(0.0, 1.0 - context.dependents * 0.15)
    loss_cap = min(1.0, context.max_bearable_loss / 0.5)
    debt_ratio = context.debt_amount / (context.investable_assets + 1.0)
    debt_drag = 1.0 - min(1.0, debt_ratio) * min(1.0, context.debt_cost / 0.3)
    factors = [reserve, stability, horizon, liquidity, dependents, loss_cap, debt_drag]
    return round(float(np.mean(factors)), 4)


def risk_tolerance(scores: dict[str, DimensionScore]) -> float:
    """Declared willingness to accept risk from behavioral items."""
    parts = [
        1.0 - _get(scores, "loss_aversion"),
        1.0 - _get(scores, "reaction_to_losses"),
        1.0 - _get(scores, "liquidity_anxiety"),
        _get(scores, "emotional_stability"),
    ]
    return round(float(np.mean(parts)), 4)


def response_consistency(
    responses: list[QuizResponse],
    scores: dict[str, DimensionScore],
    rt: float,
    revealed: float,
) -> float:
    if not responses:
        return 0.5
    values = [r.value for r in responses]
    # straight-lining penalty
    straight = 1.0 if len(set(values)) == 1 else 0.0
    # multi-item dimension coherence (low spread == coherent)
    multi = [s for s in scores.values() if s.n_items > 1]
    spread = float(np.mean([1.0 - _dim_spread(responses, s.dimension) for s in multi])) if multi else 0.7
    declared_gap = 1.0 - min(1.0, abs(rt - revealed))
    score = 0.4 * spread + 0.4 * declared_gap + 0.2 * (1.0 - straight)
    return round(float(min(1.0, max(0.0, score))), 4)


def _dim_spread(responses: list[QuizResponse], dim: str) -> float:
    vals = []
    for r in responses:
        item = CORE_ITEMS_BY_ID.get(r.question_id)
        if item and item.dimension == dim:
            vals.append(_normalize(r.value, item.reverse_scored))
    return float(np.std(vals)) if len(vals) > 1 else 0.0


def profile_confidence(scores: dict[str, DimensionScore], consistency: float) -> tuple[float, list[str]]:
    if not scores:
        return 0.3, []
    confs = [s.confidence for s in scores.values()]
    low = sorted(s.dimension for s in scores.values() if s.confidence < 0.5)
    overall = 0.6 * float(np.mean(confs)) + 0.4 * consistency
    return round(min(1.0, overall), 4), low


def compute_scores(
    responses: list[QuizResponse],
    scenario_responses: list[ScenarioResponse],
    context: FinancialContext,
    weights: RiskWeights | None = None,
    extra_items: dict[str, QuizItem] | None = None,
) -> dict:
    w = weights or RiskWeights()
    scores = score_dimensions(responses, extra_items)

    def group(dims):
        return {d: scores[d].score for d in dims if d in scores}

    rt = risk_tolerance(scores)
    revealed, _revconf = revealed_risk_behavior(scenario_responses)
    cap = risk_capacity(context)
    emotional = _get(scores, "emotional_stability")

    declared_risk = w.w_tolerance * rt + w.w_revealed * revealed + w.w_emotional * emotional
    effective_budget = min(declared_risk, cap)
    consistency = response_consistency(responses, scores, rt, revealed)
    conf, low_dims = profile_confidence(scores, consistency)

    return {
        "scoring_version": w.version,
        "dimension_scores": {d: vars(s) for d, s in scores.items()},
        "big_five_scores": group(BIG_FIVE),
        "financial_behavior_scores": group(FINANCIAL_BEHAVIOR_DIMS),
        "consumption_behavior_scores": group(CONSUMPTION_DIMS),
        "investment_behavior_scores": group(INVESTING_DIMS),
        "risk_capacity_score": cap,
        "risk_tolerance_score": rt,
        "revealed_risk_behavior_score": revealed,
        "declared_risk": round(declared_risk, 4),
        "effective_risk_budget": round(effective_budget, 4),
        "declared_vs_revealed_gap": round(rt - revealed, 4),
        "response_consistency_score": consistency,
        "profile_confidence_score": conf,
        "low_confidence_dimensions": low_dims,
    }
