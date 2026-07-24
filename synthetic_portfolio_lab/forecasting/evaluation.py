"""Forecast evaluation metrics.

Point metrics (MAE, RMSE, directional_accuracy, forecast_bias), probabilistic
metrics (Brier, calibration_error), and distributional metrics (interval_coverage,
quantile_loss). All operate on held-out realized values (temporal separation).
"""
from __future__ import annotations

import numpy as np


def mae(predicted: np.ndarray, realized: np.ndarray) -> float:
    p, r = np.asarray(predicted, float), np.asarray(realized, float)
    return float(np.mean(np.abs(p - r))) if p.size else 0.0


def rmse(predicted: np.ndarray, realized: np.ndarray) -> float:
    p, r = np.asarray(predicted, float), np.asarray(realized, float)
    return float(np.sqrt(np.mean((p - r) ** 2))) if p.size else 0.0


def forecast_bias(predicted: np.ndarray, realized: np.ndarray) -> float:
    p, r = np.asarray(predicted, float), np.asarray(realized, float)
    return float(np.mean(p - r)) if p.size else 0.0


def directional_accuracy(predicted: np.ndarray, realized: np.ndarray) -> float:
    p, r = np.asarray(predicted, float), np.asarray(realized, float)
    if p.size == 0:
        return 0.0
    return float(np.mean(np.sign(p) == np.sign(r)))


def brier_score(prob_downside: np.ndarray, realized_downside: np.ndarray) -> float:
    """Mean squared error between predicted downside probability and outcome{0,1}."""
    p, y = np.asarray(prob_downside, float), np.asarray(realized_downside, float)
    return float(np.mean((p - y) ** 2)) if p.size else 0.0


def calibration_error(prob_downside: np.ndarray, realized_downside: np.ndarray,
                      bins: int = 10) -> float:
    """Expected calibration error over probability bins."""
    p, y = np.asarray(prob_downside, float), np.asarray(realized_downside, float)
    if p.size == 0:
        return 0.0
    edges = np.linspace(0.0, 1.0, bins + 1)
    total = 0.0
    for i in range(bins):
        lo, hi = edges[i], edges[i + 1]
        mask = (p >= lo) & (p < hi) if i < bins - 1 else (p >= lo) & (p <= hi)
        if not mask.any():
            continue
        conf = p[mask].mean()
        acc = y[mask].mean()
        total += (mask.mean()) * abs(conf - acc)
    return float(total)


def interval_coverage(lowers: np.ndarray, uppers: np.ndarray, realized: np.ndarray) -> float:
    """Fraction of realized values inside the predicted [lower, upper] interval."""
    lo, hi, r = np.asarray(lowers, float), np.asarray(uppers, float), np.asarray(realized, float)
    if r.size == 0:
        return 0.0
    return float(np.mean((r >= lo) & (r <= hi)))


def quantile_loss(quantile: float, predicted_q: np.ndarray, realized: np.ndarray) -> float:
    """Pinball loss for a single quantile level q in (0,1)."""
    p, r = np.asarray(predicted_q, float), np.asarray(realized, float)
    if p.size == 0:
        return 0.0
    diff = r - p
    return float(np.mean(np.maximum(quantile * diff, (quantile - 1.0) * diff)))
