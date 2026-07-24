"""Portfolio evaluation metrics.

Two complementary views:
- PATH metrics from the (simulated) asset return series: cumulative/annualized
  return, volatility, Sharpe, Sortino, max drawdown, VaR, CVaR.
- SCENARIO metrics from the scenario shocks: expected scenario return, dispersion,
  survival rate, worst-case/expected drawdown (probability-weighted).

Same formula conventions as paper_trading/metrics.py (TRADING_DAYS, risk-free).
"""
from __future__ import annotations

import numpy as np

from ..optimization.constraints import concentration, liquidity_score
from ..schemas.models import Asset, Persona, Scenario

TRADING_DAYS = 252
RISK_FREE_RATE = 0.05
TRANSACTION_COST_RATE = 0.001  # 10 bps per unit turnover


# ─────────────── path (time-series) metrics ───────────────
def portfolio_daily_returns(weights: dict[str, float], assets_by_id: dict[str, Asset]) -> np.ndarray:
    series = []
    ws = []
    min_len = None
    for aid, w in weights.items():
        a = assets_by_id.get(aid)
        if a is None or not a.historical_series:
            continue
        s = np.asarray(a.historical_series, float)
        series.append(s)
        ws.append(w)
        min_len = len(s) if min_len is None else min(min_len, len(s))
    if not series:
        return np.array([])
    mat = np.vstack([s[-min_len:] for s in series])
    wv = np.asarray(ws).reshape(-1, 1)
    return (mat * wv).sum(axis=0)


def path_metrics(daily: np.ndarray) -> dict[str, float]:
    r = np.asarray(daily, float)
    if r.size == 0:
        return {k: 0.0 for k in (
            "cumulative_return", "annualized_return", "volatility", "sharpe_ratio",
            "sortino_ratio", "max_drawdown", "var_95", "cvar_95")}
    cum = np.cumprod(1.0 + r)
    cumulative_return = float(cum[-1] - 1.0)
    years = max(r.size / TRADING_DAYS, 1 / TRADING_DAYS)
    annualized = (1.0 + cumulative_return) ** (1.0 / years) - 1.0
    vol = float(r.std(ddof=1) * np.sqrt(TRADING_DAYS)) if r.size > 1 else 0.0
    sharpe = (annualized - RISK_FREE_RATE) / vol if vol else 0.0
    daily_rf = RISK_FREE_RATE / TRADING_DAYS
    downside = r[r < daily_rf]
    dd = float(np.sqrt(((downside - daily_rf) ** 2).mean() * TRADING_DAYS)) if downside.size else 0.0
    sortino = (annualized - RISK_FREE_RATE) / dd if dd else 0.0
    running_max = np.maximum.accumulate(cum)
    max_dd = float((cum / running_max - 1.0).min())
    var_95 = float(np.percentile(r, 5))
    cvar_95 = float(r[r <= var_95].mean()) if (r <= var_95).any() else var_95
    return {
        "cumulative_return": cumulative_return,
        "annualized_return": float(annualized),
        "volatility": vol,
        "sharpe_ratio": float(sharpe),
        "sortino_ratio": float(sortino),
        "max_drawdown": max_dd,
        "var_95": var_95,
        "cvar_95": cvar_95,
    }


# ─────────────── scenario metrics ───────────────
def scenario_return(weights: dict[str, float], scenario: Scenario, assets_by_id: dict[str, Asset]) -> float:
    sh = scenario.shocks
    cls_ret = {
        "equity": sh.equity_return,
        "fixed_income": sh.bond_return,
        "commodity": sh.commodity_return,
        "cash": 0.025 * scenario.horizon_days / 365.0,
    }
    total = 0.0
    for aid, w in weights.items():
        klass = assets_by_id[aid].asset_class if aid in assets_by_id else "cash"
        total += w * cls_ret.get(klass, 0.0)
    return float(total)


def _weighted_quantile(values: np.ndarray, probs: np.ndarray, q: float) -> float:
    order = np.argsort(values)
    v, p = values[order], probs[order]
    cum = np.cumsum(p)
    idx = np.searchsorted(cum, q)
    idx = min(idx, len(v) - 1)
    return float(v[idx])


def scenario_metrics(
    weights: dict[str, float], scenarios: list[Scenario],
    assets_by_id: dict[str, Asset], persona: Persona,
) -> dict[str, float]:
    if not scenarios:
        return {"expected_scenario_return": 0.0, "scenario_dispersion": 0.0,
                "worst_scenario_return": 0.0, "expected_drawdown": 0.0,
                "scenario_survival_rate": 1.0, "scenario_var_95": 0.0,
                "scenario_cvar_95": 0.0}
    rets = np.array([scenario_return(weights, s, assets_by_id) for s in scenarios])
    probs = np.array([s.probability for s in scenarios])
    probs = probs / probs.sum() if probs.sum() > 0 else np.ones_like(probs) / len(probs)
    expected = float((rets * probs).sum())
    dispersion = float(np.sqrt(((rets - expected) ** 2 * probs).sum()))
    worst = float(rets.min())
    expected_drawdown = float(-min(0.0, worst))
    dd_limit = persona.constraints.maximum_expected_drawdown
    survival = float(probs[rets > -dd_limit].sum())
    var = _weighted_quantile(rets, probs, 0.05)
    cvar = float(rets[rets <= var].mean()) if (rets <= var).any() else var
    return {
        "expected_scenario_return": expected,
        "scenario_dispersion": dispersion,
        "worst_scenario_return": worst,
        "expected_drawdown": expected_drawdown,
        "scenario_survival_rate": survival,
        "scenario_var_95": var,
        "scenario_cvar_95": cvar,
    }


# ─────────────── turnover / objective ───────────────
def turnover(weights: dict[str, float], baseline: dict[str, float]) -> float:
    keys = set(weights) | set(baseline)
    return float(0.5 * sum(abs(weights.get(k, 0.0) - baseline.get(k, 0.0)) for k in keys))


def objective_alignment(persona: Persona, path: dict[str, float], scen: dict[str, float]) -> float:
    """Map the persona objective to what 'good' means, score 0..1."""
    obj = persona.objectives.primary
    er = scen["expected_scenario_return"]
    dd = scen["expected_drawdown"]
    if obj in ("capital_preservation", "income_generation"):
        return float(max(0.0, 1.0 - dd / max(persona.constraints.maximum_expected_drawdown, 1e-6)))
    if obj in ("aggressive_growth", "long_term_growth", "conviction_bets", "momentum_capture"):
        return float(min(1.0, max(0.0, 0.5 + er * 3.0)))
    if obj == "mean_reversion":
        return float(min(1.0, max(0.0, 0.5 + er * 2.0)))
    return float(min(1.0, max(0.0, 0.5 + er * 2.0 - dd)))


def evaluate_portfolio(
    weights: dict[str, float], assets_by_id: dict[str, Asset],
    scenarios: list[Scenario], persona: Persona,
    baseline: dict[str, float] | None = None,
) -> dict[str, float]:
    pm = path_metrics(portfolio_daily_returns(weights, assets_by_id))
    sm = scenario_metrics(weights, scenarios, assets_by_id, persona)
    tover = turnover(weights, baseline) if baseline else 0.0
    metrics = {
        **pm,
        **sm,
        "concentration": concentration(weights),
        "liquidity_score": liquidity_score(weights, assets_by_id),
        "turnover": tover,
        "transaction_cost": tover * TRANSACTION_COST_RATE,
    }
    metrics["objective_alignment"] = objective_alignment(persona, pm, sm)
    return metrics
