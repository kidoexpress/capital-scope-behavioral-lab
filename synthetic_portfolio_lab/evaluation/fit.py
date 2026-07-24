"""Behavioral Portfolio Fit Score (configurable weights).

Initial MVP formula (weights are configurable and NOT definitive):

    behavioral_portfolio_fit =
          0.25 * persona_adherence
        + 0.20 * risk_constraint_adherence
        + 0.15 * liquidity_adherence
        + 0.15 * behavioral_consistency
        + 0.15 * scenario_stability
        + 0.10 * objective_alignment
        - violation_penalties
"""
from __future__ import annotations

from dataclasses import dataclass

from ..optimization.constraints import equity_weight, liquidity_score
from ..portfolios.construction import persona_class_targets
from ..schemas.enums import CASH_ASSET_ID
from ..schemas.models import Asset, BehavioralDecision, Persona
from .persona_metrics import decision_consistency


@dataclass
class FitWeights:
    persona_adherence: float = 0.25
    risk_constraint_adherence: float = 0.20
    liquidity_adherence: float = 0.15
    behavioral_consistency: float = 0.15
    scenario_stability: float = 0.15
    objective_alignment: float = 0.10
    violation_penalty: float = 0.10  # per violation


def persona_adherence(persona: Persona, weights: dict[str, float], assets_by_id: dict[str, Asset]) -> float:
    target = persona_class_targets(persona)
    realized_eq = equity_weight(weights, assets_by_id)
    eq_adh = 1.0 - min(1.0, abs(realized_eq - target["equity"]) / 0.5)
    port_risk = sum(w * (assets_by_id[a].risk_score if a in assets_by_id else 0.0)
                    for a, w in weights.items())
    risk_adh = 1.0 - min(1.0, abs(port_risk - persona.behavioral_traits.risk_tolerance))
    return float(0.5 * eq_adh + 0.5 * risk_adh)


def risk_constraint_adherence(violations: list[str]) -> float:
    return float(max(0.0, 1.0 - 0.25 * len(violations)))


def liquidity_adherence(persona: Persona, weights: dict[str, float], assets_by_id: dict[str, Asset]) -> float:
    liq = liquidity_score(weights, assets_by_id)
    cash = weights.get(CASH_ASSET_ID, 0.0)
    need = max(persona.constraints.minimum_cash_weight, 0.10 * persona.financial_profile.liquidity_need)
    cash_ok = 1.0 if cash >= need - 1e-9 else cash / need if need > 0 else 1.0
    return float(0.5 * min(1.0, liq) + 0.5 * cash_ok)


def scenario_stability(scenario_dispersion: float, scale: float = 0.15) -> float:
    return float(max(0.0, 1.0 - min(1.0, scenario_dispersion / scale)))


def behavioral_portfolio_fit(
    persona: Persona,
    weights: dict[str, float],
    assets_by_id: dict[str, Asset],
    decisions: list[BehavioralDecision],
    violations: list[str],
    scenario_dispersion: float,
    objective_alignment: float,
    weights_cfg: FitWeights | None = None,
) -> dict[str, float]:
    cfg = weights_cfg or FitWeights()
    components = {
        "persona_adherence": persona_adherence(persona, weights, assets_by_id),
        "risk_constraint_adherence": risk_constraint_adherence(violations),
        "liquidity_adherence": liquidity_adherence(persona, weights, assets_by_id),
        "behavioral_consistency": decision_consistency(decisions),
        "scenario_stability": scenario_stability(scenario_dispersion),
        "objective_alignment": float(objective_alignment),
    }
    penalty = cfg.violation_penalty * len(violations)
    score = (
        cfg.persona_adherence * components["persona_adherence"]
        + cfg.risk_constraint_adherence * components["risk_constraint_adherence"]
        + cfg.liquidity_adherence * components["liquidity_adherence"]
        + cfg.behavioral_consistency * components["behavioral_consistency"]
        + cfg.scenario_stability * components["scenario_stability"]
        + cfg.objective_alignment * components["objective_alignment"]
        - penalty
    )
    components["behavioral_portfolio_fit"] = float(max(0.0, min(1.0, score)))
    components["violation_penalty"] = float(penalty)
    return components
