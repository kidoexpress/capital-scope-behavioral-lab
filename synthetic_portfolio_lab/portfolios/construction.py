"""Portfolio Construction Engine.

Four methods: equal_weight, risk_based, persona_rule_based, behavioral_scenario.
The behavioral agent proposes class-level tilts; this engine computes the FINAL
weights (inverse-volatility distribution within each class) and applies the
persona's constraints. The LLM/agent never sets final weights directly.
"""
from __future__ import annotations

import numpy as np

from ..behavior.agent import PersonaAgent
from ..explanations.builder import build_explanation
from ..memory.retrieval import MemoryStore
from ..optimization.constraints import apply_constraints
from ..optimization.covariance import estimate_covariance, risk_contributions
from ..optimization.risk_budget import equal_risk_contribution
from ..schemas.models import Asset, BehavioralDecision, Persona, PortfolioCandidate, Scenario

CLASSES = ("equity", "fixed_income", "commodity", "cash")


# ─────────────── within-class distribution ───────────────
def _group_by_class(assets: list[Asset]) -> dict[str, list[Asset]]:
    groups: dict[str, list[Asset]] = {}
    for a in assets:
        groups.setdefault(a.asset_class, []).append(a)
    return groups


def _inverse_vol_weights(assets: list[Asset]) -> dict[str, float]:
    """Correlation-blind fallback, kept for degenerate cases (0 or 1 asset)."""
    if not assets:
        return {}
    inv = np.array([1.0 / max(a.volatility, 1e-3) for a in assets])
    inv = inv / inv.sum()
    return {a.asset_id: float(w) for a, w in zip(assets, inv)}


def _erc_weights(assets: list[Asset]) -> dict[str, float]:
    """Equal risk contribution within a group, accounting for correlation.

    Inverse-volatility would size two assets correlated at 0.95 as though they
    were independent diversifiers; this sizes them by the risk they add to the
    group. Falls back to inverse-vol when there is nothing to diversify.
    """
    if len(assets) < 2:
        return _inverse_vol_weights(assets)
    ids, sigma, _meta = estimate_covariance(assets)
    w, _info = equal_risk_contribution(sigma)
    return {aid: float(x) for aid, x in zip(ids, w)}


def _distribute_class_targets(
    class_targets: dict[str, float], assets: list[Asset]
) -> dict[str, float]:
    groups = _group_by_class(assets)
    weights: dict[str, float] = {}
    for klass, target in class_targets.items():
        members = groups.get(klass, [])
        if not members or target <= 0:
            continue
        within = _erc_weights(members)
        for aid, w in within.items():
            weights[aid] = weights.get(aid, 0.0) + target * w
    return weights


def _normalize_classes(ct: dict[str, float]) -> dict[str, float]:
    total = sum(max(0.0, v) for v in ct.values())
    if total <= 0:
        return {"cash": 1.0}
    return {k: max(0.0, v) / total for k, v in ct.items()}


# ─────────────── base class targets from persona ───────────────
def persona_class_targets(persona: Persona) -> dict[str, float]:
    t = persona.behavioral_traits
    fp = persona.financial_profile
    cons = persona.constraints
    equity = min(cons.maximum_equity_weight, 0.25 + 0.65 * t.risk_tolerance)
    cash = max(cons.minimum_cash_weight, 0.05 + 0.25 * fp.liquidity_need + 0.10 * t.loss_aversion)
    commodity = 0.05 * (1.0 - t.loss_aversion) * t.risk_tolerance
    fixed_income = max(0.0, 1.0 - equity - cash - commodity)
    return _normalize_classes({
        "equity": equity, "fixed_income": fixed_income,
        "commodity": commodity, "cash": cash,
    })


# ─────────────── construction methods ───────────────
def equal_weight(persona: Persona, assets: list[Asset], assets_by_id: dict[str, Asset]) -> PortfolioCandidate:
    risky = [a for a in assets if a.asset_class != "cash"]
    w = {a.asset_id: 1.0 / len(risky) for a in risky} if risky else {}
    weights, viol, adj = apply_constraints(w, persona, assets_by_id)
    return PortfolioCandidate(
        portfolio_id=f"{persona.persona_id}_equal_weight",
        persona_id=persona.persona_id, method="equal_weight",
        weights=weights, constraint_violations=viol,
        explanation={"method": "equal_weight", "constraint_adjustments": adj},
    )


def risk_based(persona: Persona, assets: list[Asset], assets_by_id: dict[str, Asset]) -> PortfolioCandidate:
    """Inverse-risk baseline: lower risk_score -> higher weight."""
    risky = [a for a in assets if a.asset_class != "cash"]
    inv = {a.asset_id: 1.0 / max(a.risk_score, 0.05) for a in risky}
    total = sum(inv.values())
    w = {k: v / total for k, v in inv.items()} if total else {}
    weights, viol, adj = apply_constraints(w, persona, assets_by_id)
    return PortfolioCandidate(
        portfolio_id=f"{persona.persona_id}_risk_based",
        persona_id=persona.persona_id, method="risk_based",
        weights=weights, constraint_violations=viol,
        explanation={"method": "risk_based", "constraint_adjustments": adj},
    )


def risk_parity(persona: Persona, assets: list[Asset], assets_by_id: dict[str, Asset]) -> PortfolioCandidate:
    """Equal risk contribution across the whole risky sleeve.

    Unlike ``risk_based`` (which ranks assets by a standalone risk_score) this
    equalises each position's share of *portfolio* variance, so correlated
    positions are jointly downweighted rather than double-counted.
    """
    risky = [a for a in assets if a.asset_class != "cash"]
    if len(risky) < 2:
        w = _inverse_vol_weights(risky)
        diagnostics: dict = {}
    else:
        ids, sigma, meta = estimate_covariance(risky)
        raw, info = equal_risk_contribution(sigma)
        w = {aid: float(x) for aid, x in zip(ids, raw)}
        diagnostics = {
            "covariance": meta,
            "solver": info,
            "risk_contributions": {
                aid: round(float(rc), 6)
                for aid, rc in zip(ids, risk_contributions(raw, sigma))
            },
        }
    weights, viol, adj = apply_constraints(w, persona, assets_by_id)
    return PortfolioCandidate(
        portfolio_id=f"{persona.persona_id}_risk_parity",
        persona_id=persona.persona_id, method="risk_parity",
        weights=weights, constraint_violations=viol,
        explanation={"method": "risk_parity", "constraint_adjustments": adj, **diagnostics},
    )


def persona_rule_based(persona: Persona, assets: list[Asset], assets_by_id: dict[str, Asset]) -> PortfolioCandidate:
    targets = persona_class_targets(persona)
    w = _distribute_class_targets(targets, assets)
    weights, viol, adj = apply_constraints(w, persona, assets_by_id)
    return PortfolioCandidate(
        portfolio_id=f"{persona.persona_id}_persona_rule_based",
        persona_id=persona.persona_id, method="persona_rule_based",
        weights=weights, constraint_violations=viol,
        explanation={"method": "persona_rule_based", "class_targets": targets,
                     "constraint_adjustments": adj},
    )


def behavioral_scenario(
    persona: Persona,
    assets: list[Asset],
    assets_by_id: dict[str, Asset],
    scenarios: list[Scenario],
    agent: PersonaAgent,
    memory_store: MemoryStore,
    intervention: dict | None = None,
) -> PortfolioCandidate:
    """Flagship method: probability-weighted persona decisions -> final weights.

    1) collect the persona's decision in each scenario
    2) weight decisions by scenario probability
    3) tilt base class targets, 4) distribute, 5) apply constraints,
    6) record all adjustments, 7) produce an auditable explanation.
    """
    base_targets = persona_class_targets(persona)

    decisions: list[BehavioralDecision] = []
    scenario_results: list[dict] = []
    equity_tilt = 0.0
    for s in scenarios:
        mems = memory_store.retrieve(persona, s)
        d = agent.decide(persona, {}, s, None, mems, intervention)
        decisions.append(d)
        eq_delta = d.allocation_changes.get("equity", 0.0)
        equity_tilt += s.probability * eq_delta
        scenario_results.append({
            "scenario_id": s.scenario_id, "action": d.action,
            "equity_delta": eq_delta, "probability": round(s.probability, 4),
            "request_human_review": d.request_human_review,
        })

    # tilt equity vs cash by the probability-weighted behavioral signal
    tilted = dict(base_targets)
    tilted["equity"] = max(0.0, base_targets.get("equity", 0.0) + equity_tilt)
    tilted["cash"] = max(0.0, base_targets.get("cash", 0.0) - equity_tilt)
    tilted = _normalize_classes(tilted)

    w = _distribute_class_targets(tilted, assets)
    weights, viol, adj = apply_constraints(w, persona, assets_by_id)

    # recompute realized class targets after constraints for the explanation
    realized_targets = {c: 0.0 for c in CLASSES}
    for aid, wt in weights.items():
        klass = assets_by_id[aid].asset_class if aid in assets_by_id else "cash"
        realized_targets[klass] = realized_targets.get(klass, 0.0) + wt

    explanation = build_explanation(
        persona, scenarios, decisions, base_targets, realized_targets,
        weights, viol, adj, assets_by_id,
    )
    explanation["method"] = "behavioral_scenario"
    explanation["equity_tilt"] = round(equity_tilt, 4)

    return PortfolioCandidate(
        portfolio_id=f"{persona.persona_id}_behavioral_scenario",
        persona_id=persona.persona_id, method="behavioral_scenario",
        weights=weights, constraint_violations=viol,
        scenario_results=scenario_results, explanation=explanation,
    )
