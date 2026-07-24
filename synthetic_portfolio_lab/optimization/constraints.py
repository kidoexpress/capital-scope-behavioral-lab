"""Deterministic weight constraints — the quantitative engine.

Behavioral agents PROPOSE tilts; this module computes the FINAL weights and
enforces persona constraints (single-asset cap, max equity, min cash, restricted
assets, per-asset bounds). All adjustments are recorded for the audit trail.
"""
from __future__ import annotations

from ..schemas.enums import CASH_ASSET_ID
from ..schemas.models import Asset, Persona

TOL = 1e-9


def normalize_weights(weights: dict[str, float]) -> dict[str, float]:
    clean = {k: max(0.0, float(v)) for k, v in weights.items()}
    total = sum(clean.values())
    if total <= 0:
        return {CASH_ASSET_ID: 1.0}
    return {k: v / total for k, v in clean.items()}


def equity_weight(weights: dict[str, float], assets_by_id: dict[str, Asset]) -> float:
    return sum(
        w for aid, w in weights.items()
        if assets_by_id.get(aid) and assets_by_id[aid].asset_class == "equity"
    )


def concentration(weights: dict[str, float]) -> float:
    """Herfindahl-Hirschman index of weights (0..1); higher == more concentrated."""
    return float(sum(w * w for w in weights.values()))


def liquidity_score(weights: dict[str, float], assets_by_id: dict[str, Asset]) -> float:
    return float(sum(
        w * (assets_by_id[aid].liquidity if aid in assets_by_id else 1.0)
        for aid, w in weights.items()
    ))


def _cap_singles_to_cash(w: dict[str, float], caps: dict[str, float]) -> tuple[dict[str, float], list[str]]:
    adj: list[str] = []
    for _ in range(6):
        excess = 0.0
        changed = False
        for aid, cap in caps.items():
            if aid == CASH_ASSET_ID:
                continue
            if w.get(aid, 0.0) > cap + 1e-6:
                excess += w[aid] - cap
                adj.append(f"capped {aid} to {cap:.3f}")
                w[aid] = cap
                changed = True
        if excess > 0:
            w[CASH_ASSET_ID] = w.get(CASH_ASSET_ID, 0.0) + excess
        if not changed:
            break
    return w, adj


def apply_constraints(
    weights: dict[str, float],
    persona: Persona,
    assets_by_id: dict[str, Asset],
) -> tuple[dict[str, float], list[str], list[str]]:
    """Return (final_weights, violations, adjustments)."""
    cons = persona.constraints
    adjustments: list[str] = []
    w = normalize_weights(weights)

    # 1) restricted assets -> move to cash
    for aid in cons.restricted_assets:
        if w.get(aid, 0.0) > 0:
            adjustments.append(f"removed restricted asset {aid}")
            w[CASH_ASSET_ID] = w.get(CASH_ASSET_ID, 0.0) + w[aid]
            w[aid] = 0.0

    # 2) per-asset caps = min(persona single cap, asset max) -> excess to cash
    caps = {}
    for aid in w:
        cap = cons.maximum_single_asset_weight
        asset = assets_by_id.get(aid)
        if asset is not None and aid != CASH_ASSET_ID:
            cap = min(cap, asset.maximum_weight)
        caps[aid] = 1.0 if aid == CASH_ASSET_ID else cap
    w, cap_adj = _cap_singles_to_cash(w, caps)
    adjustments.extend(cap_adj)

    # 3) minimum cash weight -> pull proportionally from non-cash
    cash = w.get(CASH_ASSET_ID, 0.0)
    if cash < cons.minimum_cash_weight - 1e-9:
        need = cons.minimum_cash_weight - cash
        noncash = {a: v for a, v in w.items() if a != CASH_ASSET_ID and v > 0}
        tot = sum(noncash.values())
        if tot > 0:
            for a in noncash:
                w[a] -= need * (noncash[a] / tot)
            w[CASH_ASSET_ID] = cons.minimum_cash_weight
            adjustments.append(f"raised cash to minimum {cons.minimum_cash_weight:.3f}")

    # 4) maximum equity weight -> move excess equity to cash
    eq = equity_weight(w, assets_by_id)
    if eq > cons.maximum_equity_weight + 1e-9 and eq > 0:
        scale = cons.maximum_equity_weight / eq
        moved = 0.0
        for aid in list(w):
            asset = assets_by_id.get(aid)
            if asset is not None and asset.asset_class == "equity":
                delta = w[aid] * (1.0 - scale)
                w[aid] -= delta
                moved += delta
        w[CASH_ASSET_ID] = w.get(CASH_ASSET_ID, 0.0) + moved
        adjustments.append(f"scaled equity {eq:.3f} to max {cons.maximum_equity_weight:.3f}")

    w = normalize_weights(w)

    # ── violations (post-check) ──
    violations: list[str] = []
    if equity_weight(w, assets_by_id) > cons.maximum_equity_weight + 1e-3:
        violations.append("maximum_equity_weight")
    if w.get(CASH_ASSET_ID, 0.0) < cons.minimum_cash_weight - 1e-3:
        violations.append("minimum_cash_weight")
    for aid, val in w.items():
        cap = caps.get(aid, cons.maximum_single_asset_weight)
        if val > cap + 1e-3:
            violations.append(f"maximum_single_asset_weight:{aid}")
    for aid in cons.restricted_assets:
        if w.get(aid, 0.0) > 1e-6:
            violations.append(f"restricted_asset:{aid}")

    # drop zero weights for a clean portfolio
    w = {k: round(v, 6) for k, v in w.items() if v > 1e-6}
    return normalize_weights(w), violations, adjustments
