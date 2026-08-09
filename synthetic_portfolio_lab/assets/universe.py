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


# ─────────────────── factor structure ───────────────────
# Loadings on unit-variance factors, expressed as fractions of each asset's own
# standard deviation. Drawing every asset from its own independent generator
# produced a universe with ~0 average correlation, which made every portfolio
# look perfectly diversified (diversification ratio > 4, portfolio vol < 3% on a
# 17-asset sleeve) and left correlation-aware allocation nothing to fix. Real
# assets share systematic drivers, so returns here are built as
#
#   r_i = b_market·F_mkt + b_rates·F_rates + b_cmdty·F_cmdty + b_sector·F_sector
#         + sqrt(1 - Σb²)·e_i
#
# all scaled by the asset's declared daily sigma. Because the factors are
# independent and unit-variance, the implied correlation between two assets is
# just the dot product of their loadings — auditable by inspection.
# (asset_id: (market, rates, commodity, sector_loading))
_LOADINGS = {
    "EQ_AAPL": (0.72, 0.00, 0.00, 0.38),
    "EQ_MSFT": (0.72, 0.00, 0.00, 0.38),
    "EQ_TSLA": (0.68, 0.00, 0.00, 0.34),
    "EQ_JPM":  (0.70, -0.18, 0.00, 0.30),
    "EQ_XOM":  (0.55, 0.00, 0.45, 0.25),
    "EQ_PG":   (0.55, 0.00, 0.00, 0.25),
    "EQ_JNJ":  (0.52, 0.00, 0.00, 0.25),
    "ETF_SPY": (0.97, 0.00, 0.00, 0.00),
    "ETF_QQQ": (0.82, 0.00, 0.00, 0.40),
    "ETF_VNQ": (0.62, -0.25, 0.00, 0.25),
    "FI_AGG":  (0.05, 0.88, 0.00, 0.00),
    "FI_TLT":  (-0.10, 0.95, 0.00, 0.00),
    "FI_SHY":  (0.02, 0.55, 0.00, 0.00),
    "FI_LQD":  (0.25, 0.75, 0.00, 0.00),
    "CM_GLD":  (-0.12, 0.18, 0.35, 0.00),
    "CM_DBC":  (0.22, 0.00, 0.80, 0.00),
    "CM_USO":  (0.20, 0.00, 0.78, 0.30),
}

_FACTOR_NAMES = ("market", "rates", "commodity")


def _simulate_universe_series(days: int, seed: int) -> dict[str, list[float]]:
    """Correlated daily returns for every asset in ``_BASE``, deterministic."""
    rng = np.random.default_rng(seed)

    # Shared factors, then one independent factor per sector.
    factors = {name: rng.standard_normal(days) for name in _FACTOR_NAMES}
    sectors = sorted({row[7] for row in _BASE})
    sector_factors = {s: rng.standard_normal(days) for s in sectors}

    series: dict[str, list[float]] = {}
    for aid, _sym, _klass, exp_return, volatility, _liq, _risk, sector in _BASE:
        b_mkt, b_rates, b_cmdty, b_sector = _LOADINGS[aid]
        systematic = b_mkt ** 2 + b_rates ** 2 + b_cmdty ** 2 + b_sector ** 2
        if systematic > 1.0:  # keep the decomposition a valid variance split
            scale = np.sqrt(1.0 / systematic)
            b_mkt, b_rates, b_cmdty, b_sector = (
                b_mkt * scale, b_rates * scale, b_cmdty * scale, b_sector * scale)
            systematic = 1.0
        idio = np.sqrt(max(1.0 - systematic, 0.0))

        standardized = (
            b_mkt * factors["market"]
            + b_rates * factors["rates"]
            + b_cmdty * factors["commodity"]
            + b_sector * sector_factors[sector]
            + idio * rng.standard_normal(days)
        )

        mu_daily = (1.0 + exp_return) ** (1.0 / TRADING_DAYS) - 1.0
        sigma_daily = volatility / np.sqrt(TRADING_DAYS)
        series[aid] = [float(x) for x in (mu_daily + sigma_daily * standardized)]

    return series


def build_universe(seed: int = 12345, days: int = 3 * TRADING_DAYS, include_cash: bool = True) -> list[Asset]:
    """Return the controlled universe with deterministic historical series."""
    assets: list[Asset] = []
    series_by_id = _simulate_universe_series(days, seed)
    for i, (aid, sym, klass, ret, vol, liq, risk, sector) in enumerate(_BASE):
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
                historical_series=series_by_id[aid],
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
