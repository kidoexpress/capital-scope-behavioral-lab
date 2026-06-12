"""Unit tests for paper_trading/metrics.py.

calculate_metrics takes a daily *returns* series (not an equity curve) and
returns percentage-point values (×100) for return/drawdown/VaR fields, while
sharpe_ratio/sortino_ratio/beta stay dimensionless.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import numpy as np
import pandas as pd

from paper_trading.metrics import calculate_metrics


def make_returns(daily_return: float, n: int = 252) -> pd.Series:
    index = pd.date_range("2023-01-01", periods=n, freq="B")
    return pd.Series([daily_return] * n, index=index)


def make_noisy_returns(mean: float, std: float, n: int = 252, seed: int = 7) -> pd.Series:
    rng = np.random.default_rng(seed)
    index = pd.date_range("2023-01-01", periods=n, freq="B")
    return pd.Series(rng.normal(mean, std, n), index=index)


def test_zero_return():
    m = calculate_metrics(make_returns(0.0), make_returns(0.0))
    assert abs(m["total_return"]) < 0.01
    assert abs(m["annualized_return"]) < 0.01
    assert m["sharpe_ratio"] == 0.0  # zero volatility → sharpe defined as 0


def test_positive_return():
    m = calculate_metrics(make_noisy_returns(0.001, 0.005), make_returns(0.0005))
    assert m["total_return"] > 0
    assert m["annualized_return"] > 0


def test_monotone_gain_has_no_drawdown():
    m = calculate_metrics(make_returns(0.001), make_returns(0.0005))
    assert m["max_drawdown"] == 0


def test_negative_return():
    m = calculate_metrics(make_noisy_returns(-0.001, 0.005), make_returns(0.0005))
    assert m["total_return"] < 0
    assert m["max_drawdown"] < 0  # percentage points, negative


def test_sharpe_scale():
    """Sharpe should be dimensionless, not multiplied by 100."""
    m = calculate_metrics(make_noisy_returns(0.001, 0.005), make_returns(0.0005))
    assert -20 < m["sharpe_ratio"] < 20, f"Sharpe out of range: {m['sharpe_ratio']}"


def test_returns_multiplied_by_100():
    """total_return and annualized_return should be in percentage points."""
    m = calculate_metrics(make_returns(0.001), make_returns(0.0))  # ~28% annual
    assert 10 < m["annualized_return"] < 50, f"annualized_return={m['annualized_return']}"


def test_var_is_negative_for_volatile_series():
    """VaR 95% (5th percentile daily return) should be negative for a noisy series."""
    m = calculate_metrics(make_noisy_returns(0.0, 0.01), make_returns(0.0))
    assert m["var_95"] < 0


def test_empty_series_returns_zeros():
    m = calculate_metrics(pd.Series(dtype="float64"))
    assert m["total_return"] == 0.0
    assert m["annualized_return"] == 0.0


def test_win_rate_bounds():
    m = calculate_metrics(make_noisy_returns(0.0005, 0.01))
    assert 0 <= m["win_rate"] <= 100


def test_beta_against_self_is_one():
    series = make_noisy_returns(0.0005, 0.01)
    m = calculate_metrics(series, series)
    assert abs(m["beta"] - 1.0) < 0.01
