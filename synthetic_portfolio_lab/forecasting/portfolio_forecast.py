"""Portfolio-level forecast — a range of outcomes, never a single line.

``baselines.py`` forecasts one asset at a time. This module aggregates to the
portfolio: given the FINAL weights from construction, it simulates how the
whole position could evolve and reports quantile bands over time, not a point
estimate.

Method: joint historical bootstrap, buy-and-hold. Portfolio weights are static
(``w``), so the portfolio's return on any historical day ``t`` is a single fixed
number ``r_p(t) = (R @ w)[t]`` regardless of the order days are drawn in — there
is no need to resample each asset separately and recombine. Resampling calendar
days with replacement from that one series and compounding over the horizon:

  - preserves the realized cross-asset correlation for each sampled day (unlike
    forecasting each asset independently and summing, which would understate
    tail risk by ignoring co-movement),
  - makes no Normality assumption, unlike a Gaussian Monte Carlo,
  - assumes no rebalancing during the horizon and no serial correlation between
    days (the same i.i.d.-daily assumption ``historical_bootstrap`` already
    states for single assets in baselines.py).
"""
from __future__ import annotations

import numpy as np

from ..evaluation.portfolio_metrics import portfolio_daily_returns
from ..schemas.models import Asset

TRADING_DAYS = 252
_QUANTILE_KEYS = (("p05", 5), ("p25", 25), ("p50", 50), ("p75", 75), ("p95", 95))


def _quantiles_at(cum: np.ndarray, day_idx: int) -> dict[str, float]:
    col = cum[:, day_idx]
    out = {k: float(np.percentile(col, q)) for k, q in _QUANTILE_KEYS}
    out["expected_return"] = float(col.mean())
    out["downside_probability"] = float((col < 0.0).mean())
    return out


def forecast_portfolio(
    weights: dict[str, float],
    assets_by_id: dict[str, Asset],
    horizon_days: int = TRADING_DAYS,
    n_paths: int = 4000,
    seed: int = 0,
    checkpoint_every: int = 21,  # ~1 trading month
) -> dict:
    """Bootstrap the portfolio's cumulative-return distribution over time.

    Returns a fan of quantiles at each checkpoint plus named 3/6/12-month
    horizons, so the caller never has to treat a single path as "the" forecast.
    """
    rp = portfolio_daily_returns(weights, assets_by_id)
    observations = int(rp.size)

    if observations < 2:
        # Nothing to bootstrap from; report a degenerate, clearly-flagged forecast
        # instead of silently fabricating a distribution from zero data.
        checkpoints = [
            {"day": d, "months": round(d / 21.0, 1), **{k: 0.0 for k, _ in _QUANTILE_KEYS},
             "expected_return": 0.0, "downside_probability": 0.0}
            for d in range(checkpoint_every, horizon_days + 1, checkpoint_every)
        ]
        return {
            "method": "historical_bootstrap_joint",
            "observations": observations,
            "paths_simulated": 0,
            "assumptions": ["insufficient history to bootstrap; forecast is degenerate (all zero)"],
            "checkpoints": checkpoints,
            "horizons": {label: checkpoints[-1] if checkpoints else {} for label in ("3m", "6m", "12m")},
        }

    rng = np.random.default_rng(seed)
    idx = rng.integers(0, observations, size=(n_paths, horizon_days))
    daily = rp[idx]                                   # (n_paths, horizon_days)
    cum = np.cumprod(1.0 + daily, axis=1) - 1.0        # cumulative return path per simulation

    checkpoint_days = list(range(checkpoint_every, horizon_days + 1, checkpoint_every))
    if checkpoint_days and checkpoint_days[-1] != horizon_days:
        checkpoint_days.append(horizon_days)

    checkpoints = [
        {"day": d, "months": round(d / (TRADING_DAYS / 12.0), 1), **_quantiles_at(cum, d - 1)}
        for d in checkpoint_days
    ]

    def _closest(target_day: int) -> dict:
        best = min(checkpoints, key=lambda c: abs(c["day"] - target_day))
        return best

    horizons = {
        "3m": _closest(63),
        "6m": _closest(126),
        "12m": _closest(min(252, horizon_days)),
    }

    return {
        "method": "historical_bootstrap_joint",
        "observations": observations,
        "paths_simulated": int(n_paths),
        "assumptions": [
            "i.i.d. resampling of jointly-observed daily returns (preserves realized correlation)",
            "static weights: no rebalancing during the horizon",
            "past co-movement of the simulated universe, not a guarantee of future returns",
        ],
        "checkpoints": checkpoints,
        "horizons": horizons,
    }
