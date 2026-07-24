"""Controlled asset universe for the MVP (10-30 assets).

Historical daily-return series are generated deterministically from a seed so the
lab is reproducible and self-contained (no real market data in Phase 1). Series
are simulated hypotheses, NOT real returns.
"""
from __future__ import annotations

import numpy as np

from ..schemas.enums import CASH_ASSET_ID
from ..schemas.models import Asset

TRADING_DAYS = 252

# (asset_id, symbol, asset_class, exp_return, volatility, liquidity, risk, sector)
_BASE = [
    ("EQ_AAPL", "AAPL", "equity", 0.12, 0.26, 0.99, 0.62, "technology"),
    ("EQ_MSFT", "MSFT", "equity", 0.11, 0.24, 0.99, 0.58, "technology"),
    ("EQ_TSLA", "TSLA", "equity", 0.18, 0.55, 0.97, 0.92, "technology"),
    ("EQ_JPM", "JPM", "equity", 0.09, 0.28, 0.98, 0.60, "financials"),
    ("EQ_XOM", "XOM", "equity", 0.08, 0.30, 0.97, 0.63, "energy"),
    ("EQ_PG", "PG", "equity", 0.07, 0.16, 0.98, 0.38, "consumer_staples"),
    ("EQ_JNJ", "JNJ", "equity", 0.07, 0.17, 0.98, 0.40, "healthcare"),
    ("ETF_SPY", "SPY", "etf", 0.09, 0.18, 1.00, 0.50, "broad_market"),
    ("ETF_QQQ", "QQQ", "etf", 0.12, 0.23, 1.00, 0.60, "technology"),
    ("ETF_VNQ", "VNQ", "etf", 0.07, 0.21, 0.95, 0.55, "real_estate"),
    ("FI_AGG", "AGG", "fixed_income", 0.035, 0.05, 0.96, 0.20, "aggregate_bonds"),
    ("FI_TLT", "TLT", "fixed_income", 0.03, 0.13, 0.95, 0.42, "long_treasury"),
    ("FI_SHY", "SHY", "fixed_income", 0.025, 0.02, 0.97, 0.08, "short_treasury"),
    ("FI_LQD", "LQD", "fixed_income", 0.04, 0.08, 0.94, 0.28, "corporate_bonds"),
    ("CM_GLD", "GLD", "commodity", 0.05, 0.16, 0.96, 0.45, "gold"),
    ("CM_DBC", "DBC", "commodity", 0.05, 0.19, 0.90, 0.55, "commodities"),
    ("CM_USO", "USO", "commodity", 0.04, 0.35, 0.90, 0.80, "oil"),
]


def _simulate_series(exp_return: float, volatility: float, days: int, rng: np.random.Generator) -> list[float]:
    """Daily returns ~ Normal(mu_daily, sigma_daily), deterministic given rng."""
    mu_daily = (1.0 + exp_return) ** (1.0 / TRADING_DAYS) - 1.0
    sigma_daily = volatility / np.sqrt(TRADING_DAYS)
    return [float(x) for x in rng.normal(mu_daily, sigma_daily, size=days)]


def build_universe(seed: int = 12345, days: int = 3 * TRADING_DAYS, include_cash: bool = True) -> list[Asset]:
    """Return the controlled universe with deterministic historical series."""
    assets: list[Asset] = []
    for i, (aid, sym, klass, ret, vol, liq, risk, sector) in enumerate(_BASE):
        rng = np.random.default_rng(seed + i)
        assets.append(
            Asset(
                asset_id=aid,
                symbol=sym,
                asset_class=klass,
                expected_return=ret,
                volatility=vol,
                liquidity=liq,
                risk_score=risk,
                currency="USD",
                sector=sector,
                minimum_weight=0.0,
                maximum_weight=0.35,
                allowed_personas=[],
                historical_series=_simulate_series(ret, vol, days, rng),
            )
        )
    if include_cash:
        assets.append(
            Asset(
                asset_id=CASH_ASSET_ID,
                symbol="CASH",
                asset_class="cash",
                expected_return=0.025,
                volatility=0.001,
                liquidity=1.0,
                risk_score=0.0,
                currency="USD",
                sector="cash",
                minimum_weight=0.0,
                maximum_weight=1.0,
                allowed_personas=[],
                historical_series=[0.025 / TRADING_DAYS] * days,
            )
        )
    return assets


def universe_by_id(assets: list[Asset]) -> dict[str, Asset]:
    return {a.asset_id: a for a in assets}
