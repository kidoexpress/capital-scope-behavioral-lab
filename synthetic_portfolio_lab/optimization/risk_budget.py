"""Risk-budgeted allocation (equal risk contribution and generalisations).

Inverse-volatility sizing answers "how volatile is this asset on its own?".
Risk budgeting answers "how much of the *portfolio's* risk does this position
actually carry?" — which is the question that matters once assets are correlated.

The solver minimises the convex log-barrier formulation

    f(w) = ½ w'Σw − Σ b_i ln(w_i),      w > 0

whose stationary point satisfies ``w_i (Σw)_i = b_i`` — exactly the risk-budget
condition, up to the scaling fixed by normalising at the end. Cyclical
coordinate descent solves each coordinate in closed form (a scalar quadratic),
which converges reliably; the naive multiplicative iteration
``w_i ∝ b_i / (Σw)_i`` does not, it cycles. Long-only and fully invested by
construction, and needs no external optimizer.
"""
from __future__ import annotations

import numpy as np

from .covariance import risk_contributions


def solve_risk_budget(
    sigma: np.ndarray,
    budgets: np.ndarray | None = None,
    *,
    max_iter: int = 2000,
    tol: float = 1e-10,
) -> tuple[np.ndarray, dict]:
    """Weights whose risk contributions match ``budgets`` (equal if omitted).

    Returns (weights, info) where ``info`` reports convergence and the realised
    maximum deviation from the requested budgets.
    """
    n = sigma.shape[0]
    if n == 0:
        return np.zeros(0), {"converged": True, "iterations": 0, "max_deviation": 0.0}
    if n == 1:
        return np.ones(1), {"converged": True, "iterations": 0, "max_deviation": 0.0}

    if budgets is None:
        b = np.full(n, 1.0 / n)
    else:
        b = np.asarray(budgets, dtype=float).copy()
        b = np.maximum(b, 0.0)
        total = b.sum()
        b = np.full(n, 1.0 / n) if total <= 0 else b / total

    # Assets with a zero budget are excluded rather than driven to a zero
    # denominator; solve on the active subset and pad the result back.
    active = b > 1e-12
    if not active.all():
        w_sub, info = solve_risk_budget(
            sigma[np.ix_(active, active)], b[active], max_iter=max_iter, tol=tol
        )
        w = np.zeros(n)
        w[active] = w_sub
        return w, info

    # Start from inverse-volatility — a decent guess that ignores correlation.
    vol = np.sqrt(np.maximum(np.diag(sigma), 1e-18))
    w = b / vol
    w /= w.sum()

    diag = np.maximum(np.diag(sigma), 1e-18)
    converged, iterations = False, 0
    for iterations in range(1, max_iter + 1):
        w_prev = w.copy()
        for i in range(n):
            # Solve sigma_ii * w_i^2 + c * w_i - b_i = 0 for w_i > 0,
            # with c the risk this asset picks up from every other position.
            c = float(sigma[i] @ w) - diag[i] * w[i]
            w[i] = (-c + np.sqrt(c * c + 4.0 * diag[i] * b[i])) / (2.0 * diag[i])
        # No rescaling inside the loop: the barrier problem has its own scale
        # (w'Σw = 1 at the optimum) and renormalising each sweep breaks the
        # fixed point. Risk contributions are scale-invariant, so normalise once
        # the sweeps have settled.
        if float(np.abs(w - w_prev).max()) < tol:
            converged = True
            break

    w = w / w.sum()

    rc = risk_contributions(w, sigma)
    return w, {
        "converged": converged,
        "iterations": iterations,
        "max_deviation": float(np.abs(rc - b).max()),
    }


def equal_risk_contribution(sigma: np.ndarray) -> tuple[np.ndarray, dict]:
    """Every position carries the same share of portfolio risk."""
    return solve_risk_budget(sigma, None)
