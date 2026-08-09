"""Covariance estimation — the missing risk dimension.

Every construction method in this lab used to size positions from each asset's
own volatility alone, which treats two assets correlated at 0.95 as if they were
independent diversifiers. This module estimates the full covariance matrix from
``Asset.historical_series`` (already carried on every asset) so allocation can
account for how assets move *together*.

Sample covariance is a poor estimator when the number of assets is not small
relative to the length of the history: the extreme eigenvalues are biased and an
optimizer will happily load up on whatever the noise says is a diversifier. We
therefore shrink toward a constant-correlation target using the Ledoit-Wolf
(2004) analytic intensity, which needs no cross-validation.

Assets whose history is missing or too short are NOT dropped and NOT treated as
uncorrelated (either would understate risk). Their declared ``volatility`` is
placed on the diagonal and they are linked to the rest at the average estimated
correlation, then reported in ``meta['synthesized']`` so callers can disclose it.
"""
from __future__ import annotations

import numpy as np

from ..schemas.models import Asset

TRADING_DAYS = 252
MIN_OBSERVATIONS = 60  # below this a series cannot carry a usable correlation


def _ledoit_wolf_constant_correlation(X: np.ndarray) -> tuple[np.ndarray, float, float]:
    """Shrink the sample covariance of demeaned returns ``X`` (T x N).

    Returns (sigma, shrinkage_intensity, average_correlation).
    """
    T, N = X.shape
    S = (X.T @ X) / T

    var = np.diag(S).copy()
    sd = np.sqrt(np.maximum(var, 1e-18))

    if N < 2:
        return S, 0.0, 0.0

    # ── constant-correlation target ──
    R = S / np.outer(sd, sd)
    off_diag = ~np.eye(N, dtype=bool)
    r_bar = float(R[off_diag].mean())
    F = r_bar * np.outer(sd, sd)
    np.fill_diagonal(F, var)

    # ── pi: sum of asymptotic variances of the sample covariances ──
    X2 = X ** 2
    pi_mat = (X2.T @ X2) / T - S ** 2
    pi_hat = float(pi_mat.sum())

    # ── rho: asymptotic covariance between target and sample ──
    # theta_ii_ij = E[(x_i^2 - s_ii)(x_i x_j - s_ij)] = E[x_i^3 x_j] - s_ii * s_ij
    third = (X ** 3).T @ X / T
    theta_ii_ij = third - var[:, None] * S       # element [i, j]
    theta_jj_ij = third.T - var[None, :] * S     # element [i, j], roles swapped

    ratio = np.outer(sd, 1.0 / sd)               # sd_i / sd_j
    rho_off = (r_bar / 2.0) * ((1.0 / ratio) * theta_ii_ij + ratio * theta_jj_ij)
    rho_hat = float(np.diag(pi_mat).sum() + rho_off[off_diag].sum())

    # ── gamma: misspecification of the target ──
    gamma_hat = float(((F - S) ** 2).sum())

    if gamma_hat <= 0:
        delta = 0.0
    else:
        delta = max(0.0, min(1.0, ((pi_hat - rho_hat) / gamma_hat) / T))

    sigma = delta * F + (1.0 - delta) * S
    return sigma, float(delta), r_bar


def estimate_covariance(
    assets: list[Asset],
    min_observations: int = MIN_OBSERVATIONS,
) -> tuple[list[str], np.ndarray, dict]:
    """Annualized covariance matrix for ``assets``.

    Returns (asset_ids, sigma, meta). ``sigma`` is ordered to match ``asset_ids``.
    """
    asset_ids = [a.asset_id for a in assets]
    n = len(assets)
    if n == 0:
        return [], np.zeros((0, 0)), {"observations": 0, "shrinkage": 0.0, "synthesized": []}

    # Split into assets with usable history and those without.
    usable_idx, series = [], []
    for i, a in enumerate(assets):
        s = np.asarray(a.historical_series, dtype=float)
        if s.size >= min_observations:
            usable_idx.append(i)
            series.append(s)

    synthesized = [assets[i].asset_id for i in range(n) if i not in set(usable_idx)]
    declared_vol = np.array([max(a.volatility, 1e-6) for a in assets], dtype=float)

    if len(usable_idx) < 2:
        # Not enough history to estimate any correlation. Fall back to declared
        # volatilities with a neutral positive correlation rather than pretending
        # the assets are independent.
        r_bar = 0.20
        sigma = r_bar * np.outer(declared_vol, declared_vol)
        np.fill_diagonal(sigma, declared_vol ** 2)
        return asset_ids, sigma, {
            "observations": 0,
            "shrinkage": 1.0,
            "average_correlation": r_bar,
            "synthesized": asset_ids,
            "note": "insufficient history; declared volatilities with assumed correlation",
        }

    # Align on the shortest usable history (most recent observations).
    min_len = min(s.size for s in series)
    X = np.vstack([s[-min_len:] for s in series]).T          # T x k
    X = X - X.mean(axis=0, keepdims=True)

    sigma_k, delta, r_bar = _ledoit_wolf_constant_correlation(X)
    sigma_k *= TRADING_DAYS                                   # annualize

    # Embed the estimated block into the full matrix.
    sigma = np.zeros((n, n), dtype=float)
    vol = declared_vol.copy()
    for a_pos, i in enumerate(usable_idx):
        vol[i] = float(np.sqrt(max(sigma_k[a_pos, a_pos], 1e-18)))

    for a_pos, i in enumerate(usable_idx):
        for b_pos, j in enumerate(usable_idx):
            sigma[i, j] = sigma_k[a_pos, b_pos]

    # Assets without history: declared vol on the diagonal, average correlation
    # to everything else. Never zero — zero correlation is a free lunch.
    synth_positions = [i for i in range(n) if i not in set(usable_idx)]
    for i in synth_positions:
        sigma[i, i] = vol[i] ** 2
        for j in range(n):
            if j == i:
                continue
            sigma[i, j] = sigma[j, i] = r_bar * vol[i] * vol[j]

    sigma = 0.5 * (sigma + sigma.T)  # enforce exact symmetry

    return asset_ids, sigma, {
        "observations": int(min_len),
        "shrinkage": round(delta, 4),
        "average_correlation": round(r_bar, 4),
        "synthesized": synthesized,
    }


def portfolio_volatility(weights: np.ndarray, sigma: np.ndarray) -> float:
    """Annualized portfolio volatility."""
    return float(np.sqrt(max(weights @ sigma @ weights, 0.0)))


def risk_contributions(weights: np.ndarray, sigma: np.ndarray) -> np.ndarray:
    """Fraction of total portfolio variance attributable to each position.

    This is what inverse-volatility sizing gets wrong: equal weights on
    correlated assets produce very unequal risk contributions.
    """
    total = float(weights @ sigma @ weights)
    if total <= 0:
        return np.zeros_like(weights)
    return weights * (sigma @ weights) / total


def diversification_ratio(weights: np.ndarray, sigma: np.ndarray) -> float:
    """Weighted average volatility / portfolio volatility.

    1.0 means no diversification benefit at all; higher is better.
    """
    vol = np.sqrt(np.diag(sigma))
    pv = portfolio_volatility(weights, sigma)
    if pv <= 0:
        return 1.0
    return float((weights @ vol) / pv)
