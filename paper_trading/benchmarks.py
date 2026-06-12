from __future__ import annotations

import pandas as pd

from .data_feed import get_historical_prices


BENCHMARK_TICKERS = {
    "SPY": "SPY",
    "QQQ": "QQQ",
    "BRK-B": "BRK-B",
    "ARKK": "ARKK",
    "BOVA11.SA": "BOVA11.SA",   # Brazil
    "ISF.L":     "ISF.L",       # UK
    "EXS1.DE":   "EXS1.DE",     # Germany
    "1306.T":    "1306.T",      # Japan
    "2800.HK":   "2800.HK",     # Hong Kong
}


def get_benchmarks(start: str, end: str) -> dict[str, pd.Series]:
    prices = get_historical_prices(list(BENCHMARK_TICKERS.values()), start, end)
    returns: dict[str, pd.Series] = {}
    for label, ticker in BENCHMARK_TICKERS.items():
        # Try multiple column name formats — yfinance versions differ on BRK-B vs BRK.B
        candidates = [ticker, ticker.replace("-", "."), ticker.replace(".", "-")]
        column = next((c for c in candidates if c in prices.columns), None)
        if column is None:
            continue
        series = prices[column].pct_change().dropna()
        if not series.empty:
            returns[label] = series
    return returns
