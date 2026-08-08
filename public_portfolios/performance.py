"""Performance of a disclosed public portfolio, computed from real prices.

Reuses the existing paper-trading price feed (Yahoo Finance). Nothing here is a
prediction: it measures how the DISCLOSED weights would have performed since the
filing period, which is not the manager's actual return (they traded during the
undisclosed window, hold unreported instruments, and the filing itself is lagged).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd

from paper_trading.data_feed import get_historical_prices

BENCHMARK = "SPY"


@dataclass
class PerformanceResult:
    start: str
    end: str
    portfolio_return: float | None
    benchmark_return: float | None
    excess_return: float | None
    volatility: float | None
    max_drawdown: float | None
    coverage: float          # share of portfolio weight actually priced
    priced_holdings: int
    total_holdings: int
    note: str = ""


def _drawdown(curve: pd.Series) -> float:
    running_max = curve.cummax()
    return float((curve / running_max - 1.0).min())


def evaluate_disclosed_portfolio(
    weights: dict[str, float],
    since: str,
    end: str | None = None,
) -> PerformanceResult:
    """Buy-and-hold return of the disclosed weights from `since` to `end`.

    `weights` maps ticker -> weight (only resolvable tickers should be passed).
    Weights are renormalized over whatever can actually be priced, and the
    resulting coverage is reported so partial data is never presented as complete.
    """
    end = end or date.today().isoformat()
    total_names = len(weights)
    if not weights:
        return PerformanceResult(since, end, None, None, None, None, None, 0.0, 0, 0,
                                 "No resolvable tickers in this filing.")

    tickers = sorted(weights)
    try:
        prices = get_historical_prices(tickers + [BENCHMARK], since, end)
    except Exception as exc:  # network/feed failure must not fabricate numbers
        return PerformanceResult(since, end, None, None, None, None, None, 0.0, 0, total_names,
                                 f"Price data unavailable: {exc}")

    if prices is None or prices.empty:
        return PerformanceResult(since, end, None, None, None, None, None, 0.0, 0, total_names,
                                 "Price feed returned no data for this period.")

    prices = prices.dropna(axis=1, how="all").ffill()
    available = [t for t in tickers if t in prices.columns and prices[t].notna().any()]
    if not available:
        return PerformanceResult(since, end, None, None, None, None, None, 0.0, 0, total_names,
                                 "None of the holdings could be priced.")

    covered_weight = sum(weights[t] for t in available)
    if covered_weight <= 0:
        return PerformanceResult(since, end, None, None, None, None, None, 0.0, 0, total_names,
                                 "Priced holdings carry no weight.")

    norm = {t: weights[t] / covered_weight for t in available}
    sub = prices[available].dropna(how="all")
    returns = sub.pct_change().fillna(0.0)
    w = np.array([norm[t] for t in available])
    port_daily = returns.to_numpy() @ w
    curve = pd.Series((1.0 + port_daily).cumprod(), index=sub.index)

    port_return = float(curve.iloc[-1] - 1.0)
    vol = float(pd.Series(port_daily).std(ddof=1) * np.sqrt(252)) if len(port_daily) > 1 else None
    mdd = _drawdown(curve)

    bench_return = None
    if BENCHMARK in prices.columns and prices[BENCHMARK].notna().any():
        b = prices[BENCHMARK].dropna()
        if len(b) > 1:
            bench_return = float(b.iloc[-1] / b.iloc[0] - 1.0)

    excess = port_return - bench_return if bench_return is not None else None

    return PerformanceResult(
        start=str(sub.index[0].date()) if hasattr(sub.index[0], "date") else since,
        end=str(sub.index[-1].date()) if hasattr(sub.index[-1], "date") else end,
        portfolio_return=port_return,
        benchmark_return=bench_return,
        excess_return=excess,
        volatility=vol,
        max_drawdown=mdd,
        coverage=covered_weight,
        priced_holdings=len(available),
        total_holdings=total_names,
        note="Hypothetical buy-and-hold of the disclosed weights — not the manager's realized return.",
    )


def period_start_from(period: str) -> str:
    """Filing period end (e.g. 2026-03-31) -> the day pricing should start."""
    try:
        d = datetime.fromisoformat(period).date()
    except ValueError:
        d = date.today() - timedelta(days=180)
    return (d + timedelta(days=1)).isoformat()
