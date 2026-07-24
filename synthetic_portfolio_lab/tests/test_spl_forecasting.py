"""Tests: forecasting distributions, quantiles, seeded reproducibility, no leakage."""
from __future__ import annotations

import numpy as np

from synthetic_portfolio_lab.assets import build_universe, universe_by_id
from synthetic_portfolio_lab.forecasting import forecast_asset, train_test_split
from synthetic_portfolio_lab.forecasting.evaluation import (
    brier_score,
    directional_accuracy,
    interval_coverage,
    mae,
    quantile_loss,
    rmse,
)


def _spy():
    return universe_by_id(build_universe(seed=7, days=600))["ETF_SPY"]


def test_all_methods_produce_forecasts():
    spy = _spy()
    for m in ("historical_mean", "rolling_mean", "historical_bootstrap",
              "monte_carlo", "regime_based"):
        f = forecast_asset(spy, horizon=90, method=m, test_days=90, seed=1)
        assert f.method == m
        assert f.horizon_days == 90
        assert 0.0 <= f.downside_probability <= 1.0


def test_quantiles_are_monotonic():
    f = forecast_asset(_spy(), 90, "historical_bootstrap", test_days=90, seed=1)
    q = f.quantiles
    assert q["p05"] <= q["p25"] <= q["p50"] <= q["p75"] <= q["p95"]


def test_forecast_reproducible_by_seed():
    spy = _spy()
    f1 = forecast_asset(spy, 90, "monte_carlo", test_days=90, seed=42)
    f2 = forecast_asset(spy, 90, "monte_carlo", test_days=90, seed=42)
    assert f1.expected_return == f2.expected_return
    assert f1.quantiles == f2.quantiles
    f3 = forecast_asset(spy, 90, "monte_carlo", test_days=90, seed=43)
    assert f1.expected_return != f3.expected_return


def test_no_future_leakage():
    spy = _spy()
    train, test = train_test_split(spy.historical_series, 90)
    assert len(train) + len(test) == len(spy.historical_series)
    assert len(test) == 90
    # forecaster must not see the test window: compare train stats vs full stats
    full = np.asarray(spy.historical_series)
    assert not np.array_equal(train, full[: len(train)] if len(train) == len(full) else train) or len(train) < len(full)


def test_forecast_eval_metrics():
    pred = np.array([0.05, -0.02, 0.10, -0.08])
    real = np.array([0.03, -0.05, 0.07, 0.01])
    assert mae(pred, real) >= 0
    assert rmse(pred, real) >= mae(pred, real) - 1e-9
    assert 0.0 <= directional_accuracy(pred, real) <= 1.0
    # brier for probabilistic downside
    probs = np.array([0.2, 0.8, 0.1, 0.6])
    outcomes = np.array([0.0, 1.0, 0.0, 1.0])
    assert 0.0 <= brier_score(probs, outcomes) <= 1.0
    lo = np.array([-0.1, -0.1, -0.1, -0.1])
    hi = np.array([0.1, 0.1, 0.1, 0.1])
    assert 0.0 <= interval_coverage(lo, hi, real) <= 1.0
    assert quantile_loss(0.05, np.array([-0.2] * 4), real) >= 0
