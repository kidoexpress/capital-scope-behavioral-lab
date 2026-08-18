"""Thematic Lab — a concentrated, sector/asset-class-focused portfolio.

Deliberately separate from the persona-driven Financial Twin flow: no quiz, no
scenarios, no behavioral tilts. The user picks a theme and a budget; this
module filters the same simulated universe (build_universe) down to that
theme and sizes it with the same equal-risk-contribution engine already built
for the Financial Twin's risk_parity method — reused, not reimplemented, so
the two tools stay numerically consistent with each other.

Themes map to real sector/asset_class values in assets/universe.py, so this
list stays accurate only as long as it's kept in sync with that file by hand
(no dynamic discovery — an explicit, readable registry beats implicit magic
for something this small).
"""
from __future__ import annotations

from ..optimization.covariance import (
    diversification_ratio,
    estimate_covariance,
    portfolio_volatility,
    risk_contributions,
)
from ..optimization.risk_budget import equal_risk_contribution
from ..schemas.models import Asset

THEMES: dict[str, dict] = {
    "technology": {"label": "Technology", "match": lambda a: a.sector == "technology"},
    "financials": {"label": "Financials", "match": lambda a: a.sector == "financials"},
    "energy": {"label": "Energy", "match": lambda a: a.sector == "energy"},
    "healthcare": {"label": "Healthcare", "match": lambda a: a.sector == "healthcare"},
    "real_estate": {"label": "Real Estate", "match": lambda a: a.sector == "real_estate"},
    "consumer_staples": {"label": "Consumer Staples", "match": lambda a: a.sector == "consumer_staples"},
    "commodities": {"label": "Commodities", "match": lambda a: a.asset_class == "commodity"},
    "fixed_income": {"label": "Fixed Income", "match": lambda a: a.asset_class == "fixed_income"},
}


def theme_catalog(assets: list[Asset]) -> list[dict]:
    """Themes with how many universe instruments each currently matches —
    shown to the user before they commit, since a 1-instrument theme has no
    diversification to offer and shouldn't be a surprise after the fact."""
    out = []
    for key, meta in THEMES.items():
        matches = [a for a in assets if meta["match"](a)]
        out.append({
            "key": key,
            "label": meta["label"],
            "instrument_count": len(matches),
            "symbols": [a.symbol for a in matches],
        })
    return out


def build_thematic_portfolio(
    theme: str,
    budget: float,
    assets: list[Asset],
    assets_by_id: dict[str, Asset],
) -> dict:
    """Equal-risk-contribution portfolio over one theme's matching assets."""
    if theme not in THEMES:
        raise ValueError(f"unknown theme: {theme}")
    if budget <= 0:
        raise ValueError("budget must be positive")

    matches = [a for a in assets if THEMES[theme]["match"](a)]
    if not matches:
        raise ValueError(f"theme '{theme}' has no matching instruments in the current universe")

    ids, sigma, cov_meta = estimate_covariance(matches)
    weights_arr, solver_info = equal_risk_contribution(sigma)
    weights = {aid: float(w) for aid, w in zip(ids, weights_arr)}
    rc = risk_contributions(weights_arr, sigma)

    allocation = sorted(
        (
            {
                "asset_id": aid,
                "symbol": assets_by_id[aid].symbol,
                "name": assets_by_id[aid].name,
                "sector": assets_by_id[aid].sector,
                "country": assets_by_id[aid].country,
                "weight": round(w, 6),
                "risk_contribution": round(float(r), 6),
                "amount": round(w * budget, 2),
            }
            for aid, w, r in zip(ids, weights_arr, rc)
        ),
        key=lambda row: row["weight"],
        reverse=True,
    )

    return {
        "theme": theme,
        "theme_label": THEMES[theme]["label"],
        "budget": budget,
        "allocation": allocation,
        "instrument_count": len(matches),
        "risk": {
            "portfolio_volatility": round(portfolio_volatility(weights_arr, sigma), 6),
            "diversification_ratio": round(diversification_ratio(weights_arr, sigma), 4),
            "covariance": cov_meta,
            "solver": solver_info,
        },
        "weights_by_asset_id": weights,
    }
