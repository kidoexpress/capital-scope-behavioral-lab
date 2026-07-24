"""Auditable explanation builder.

Explanations reference concrete IDs (scenarios, decisions, memories, constraints,
assets) — never generic text. Answers: which scenarios weighed most, which
behaviors drove the allocation, which memories were used, which constraints
changed the proposal, which assets were limited, and which risks remain.
"""
from __future__ import annotations

from ..schemas.models import Asset, BehavioralDecision, Persona, Scenario


def build_explanation(
    persona: Persona,
    scenarios: list[Scenario],
    decisions: list[BehavioralDecision],
    class_targets_before: dict[str, float],
    class_targets_after: dict[str, float],
    weights: dict[str, float],
    violations: list[str],
    adjustments: list[str],
    assets_by_id: dict[str, Asset],
) -> dict:
    scen_by_id = {s.scenario_id: s for s in scenarios}

    scenarios_weighted = sorted(
        ({"scenario_id": s.scenario_id, "name": s.name,
          "probability": round(s.probability, 4), "regime": s.market_regime}
         for s in scenarios),
        key=lambda d: d["probability"], reverse=True,
    )

    behavioral_influences = [
        {
            "scenario_id": d.scenario_id,
            "action": d.action,
            "equity_delta": d.allocation_changes.get("equity", 0.0),
            "probability": round(scen_by_id[d.scenario_id].probability, 4)
            if d.scenario_id in scen_by_id else None,
            "reason_codes": d.reason_codes,
            "memories_used": d.memories_used,
        }
        for d in decisions
    ]

    memories_used = sorted({m for d in decisions for m in d.memories_used})

    limited_assets = sorted({
        a.split()[1] for a in adjustments
        if a.startswith("capped ") or a.startswith("removed restricted")
    }) if adjustments else []

    # remaining risks: residual equity exposure under high-probability adverse scenarios
    remaining_risks: list[str] = []
    equity_final = class_targets_after.get("equity", 0.0)
    adverse_prob = sum(
        s.probability for s in scenarios
        if s.market_regime in ("bear", "risk_off") or s.shocks.equity_return < -0.05
    )
    if equity_final > 0.3 and adverse_prob > 0.2:
        remaining_risks.append(
            f"residual_equity_exposure={equity_final:.2f} under adverse_scenario_prob={adverse_prob:.2f}"
        )
    if persona.constraints.maximum_expected_drawdown < 0.15 and equity_final > 0.4:
        remaining_risks.append("equity_above_low_drawdown_tolerance")

    return {
        "persona_id": persona.persona_id,
        "objective": {"primary": persona.objectives.primary,
                      "secondary": persona.objectives.secondary},
        "scenarios_weighted": scenarios_weighted,
        "behavioral_influences": behavioral_influences,
        "memories_used": memories_used,
        "class_targets_before": {k: round(v, 4) for k, v in class_targets_before.items()},
        "class_targets_after": {k: round(v, 4) for k, v in class_targets_after.items()},
        "constraint_adjustments": adjustments,
        "constraint_violations": violations,
        "limited_assets": limited_assets,
        "remaining_risks": remaining_risks,
    }
