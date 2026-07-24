"""Forecasting baselines — produce return DISTRIBUTIONS over a horizon.

Every forecaster receives only the TRAIN slice of a return series and a horizon;
no data after the train cutoff is used (no future leakage). Output is a Forecast
with expected/median/volatility, downside probability and p05..p95 quantiles.

Methods: historical_mean, rolling_mean, historical_bootstrap, monte_carlo,
regime_based. No deep learning in Phase 1.
"""
from __future__ import annotations

import numpy as np

from ..schemas.models import Asset, Forecast
from .regime import REGIME_ADJUST, SimpleRegimeClassifier

_QUANTILE_KEYS = [("p05", 5), ("p25", 25), ("p50", 50), ("p75", 75), ("p95", 95)]


def train_test_split(series: list[float], test_days: int) -> tuple[np.ndarray, np.ndarray]:
    """Split a daily-return series into (train, test); test is the last N days."""
    arr = np.asarray(series, dtype=float)
    if test_days <= 0 or test_days >= arr.size:
        return arr, np.array([])
    return arr[:-test_days], arr[-test_days:]


def _quantiles(samples: np.ndarray) -> dict[str, float]:
    return {k: float(np.percentile(samples, q)) for k, q in _QUANTILE_KEYS}


def _forecast_from_samples(asset_id, horizon, samples, method, confidence, assumptions) -> Forecast:
    samples = np.asarray(samples, dtype=float)
    return Forecast(
        asset_id=asset_id,
        horizon_days=horizon,
        expected_return=float(samples.mean()),
        median_return=float(np.median(samples)),
        volatility=float(samples.std(ddof=1)) if samples.size > 1 else 0.0,
        downside_probability=float((samples < 0).mean()),
        quantiles=_quantiles(samples),
        confidence=confidence,
        method=method,
        assumptions=assumptions,
    )


def _normal_samples(mu_h: float, sigma_h: float, n: int, rng: np.random.Generator) -> np.ndarray:
    return rng.normal(mu_h, sigma_h, size=n)


def _horizon_moments(daily: np.ndarray, horizon: int) -> tuple[float, float]:
    """Approximate horizon mean/std of the compounded return from daily stats."""
    mu_d = float(daily.mean()) if daily.size else 0.0
    sigma_d = float(daily.std(ddof=1)) if daily.size > 1 else 0.0
    mu_h = (1.0 + mu_d) ** horizon - 1.0
    sigma_h = sigma_d * np.sqrt(horizon)
    return mu_h, sigma_h


def historical_mean(asset: Asset, train: np.ndarray, horizon: int, n: int = 5000, seed: int = 0) -> Forecast:
    rng = np.random.default_rng(seed)
    mu_h, sigma_h = _horizon_moments(train, horizon)
    samples = _normal_samples(mu_h, sigma_h, n, rng)
    return _forecast_from_samples(asset.asset_id, horizon, samples, "historical_mean",
                                  0.45, ["daily returns i.i.d. Normal from full history"])


def rolling_mean(asset: Asset, train: np.ndarray, horizon: int, window: int = 63,
                 n: int = 5000, seed: int = 0) -> Forecast:
    rng = np.random.default_rng(seed)
    w = train[-window:] if train.size > window else train
    mu_h, sigma_h = _horizon_moments(w, horizon)
    samples = _normal_samples(mu_h, sigma_h, n, rng)
    return _forecast_from_samples(asset.asset_id, horizon, samples, "rolling_mean",
                                  0.45, [f"last {window} trading days, i.i.d. Normal"])


def historical_bootstrap(asset: Asset, train: np.ndarray, horizon: int,
                         n: int = 5000, seed: int = 0) -> Forecast:
    """Resample daily returns with replacement, compound over the horizon."""
    rng = np.random.default_rng(seed)
    if train.size == 0:
        return _forecast_from_samples(asset.asset_id, horizon, np.zeros(n),
                                      "historical_bootstrap", 0.5, ["empty series"])
    draws = rng.choice(train, size=(n, horizon), replace=True)
    horizon_returns = np.prod(1.0 + draws, axis=1) - 1.0
    return _forecast_from_samples(asset.asset_id, horizon, horizon_returns,
                                  "historical_bootstrap", 0.6,
                                  ["block bootstrap of empirical daily returns"])


def monte_carlo(asset: Asset, train: np.ndarray, horizon: int,
                n: int = 5000, seed: int = 0) -> Forecast:
    """Simulate Normal daily-return paths from train statistics, compound them."""
    rng = np.random.default_rng(seed)
    mu_d = float(train.mean()) if train.size else 0.0
    sigma_d = float(train.std(ddof=1)) if train.size > 1 else 0.0
    paths = rng.normal(mu_d, sigma_d, size=(n, horizon))
    horizon_returns = np.prod(1.0 + paths, axis=1) - 1.0
    return _forecast_from_samples(asset.asset_id, horizon, horizon_returns,
                                  "monte_carlo", 0.55, ["Normal daily returns, seeded paths"])


def regime_based(asset: Asset, train: np.ndarray, horizon: int,
                 n: int = 5000, seed: int = 0, classifier: SimpleRegimeClassifier | None = None) -> Forecast:
    """Classify the regime from train data and adjust drift/vol accordingly."""
    rng = np.random.default_rng(seed)
    clf = classifier or SimpleRegimeClassifier()
    regime = clf.classify(train)
    drift_mult, vol_mult = REGIME_ADJUST.get(regime, (1.0, 1.0))
    mu_h, sigma_h = _horizon_moments(train, horizon)
    samples = _normal_samples(mu_h * drift_mult, sigma_h * vol_mult, n, rng)
    return _forecast_from_samples(asset.asset_id, horizon, samples, "regime_based",
                                  0.5, [f"classified regime={regime}", "adjusted drift/vol"])


FORECASTERS = {
    "historical_mean": historical_mean,
    "rolling_mean": rolling_mean,
    "historical_bootstrap": historical_bootstrap,
    "monte_carlo": monte_carlo,
    "regime_based": regime_based,
}


def forecast_asset(asset: Asset, horizon: int, method: str = "historical_bootstrap",
                   test_days: int = 0, seed: int = 0) -> Forecast:
    """Forecast one asset using only data before the test window (no leakage)."""
    train, _ = train_test_split(asset.historical_series, test_days)
    if method not in FORECASTERS:
        raise ValueError(f"unknown forecast method: {method}")
    return FORECASTERS[method](asset, train, horizon, seed=seed)
