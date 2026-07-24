"""Market regime classification.

Phase 1 uses a simple, documented rule-based classifier. The RegimeClassifier
interface lets HMM / clustering / supervised / macro models replace it later
without touching callers.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

TRADING_DAYS = 252


class RegimeClassifier(ABC):
    @abstractmethod
    def classify(self, returns: np.ndarray) -> str:
        """Return one of enums.MARKET_REGIMES for a series of daily returns."""


class SimpleRegimeClassifier(RegimeClassifier):
    """Documented thresholds on annualized drift and volatility.

    - annualized drift  > +6%  -> bull;  < -6% -> bear; else sideways
    - annualized vol    > 25%  -> high_volatility; < 10% -> low_volatility
    The trend label is primary; volatility refines risk_on/risk_off only when the
    trend is roughly flat.
    """

    def __init__(self, bull_thr: float = 0.06, bear_thr: float = -0.06,
                 high_vol: float = 0.25, low_vol: float = 0.10) -> None:
        self.bull_thr = bull_thr
        self.bear_thr = bear_thr
        self.high_vol = high_vol
        self.low_vol = low_vol

    def classify(self, returns: np.ndarray) -> str:
        r = np.asarray(returns, dtype=float)
        if r.size == 0:
            return "sideways"
        ann_drift = (1.0 + r.mean()) ** TRADING_DAYS - 1.0
        ann_vol = r.std(ddof=1) * np.sqrt(TRADING_DAYS) if r.size > 1 else 0.0
        if ann_drift > self.bull_thr:
            return "bull"
        if ann_drift < self.bear_thr:
            return "bear"
        # roughly flat trend -> refine by volatility
        if ann_vol > self.high_vol:
            return "high_volatility"
        if ann_vol < self.low_vol:
            return "low_volatility"
        return "sideways"


# Regime -> (drift multiplier, vol multiplier) applied to sample statistics.
REGIME_ADJUST = {
    "bull": (1.3, 0.9),
    "bear": (0.5, 1.3),
    "sideways": (1.0, 1.0),
    "high_volatility": (0.9, 1.4),
    "low_volatility": (1.05, 0.7),
    "risk_on": (1.2, 0.95),
    "risk_off": (0.7, 1.25),
}
