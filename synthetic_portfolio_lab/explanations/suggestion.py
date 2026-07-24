"""Investor-facing suggestion builder.

Turns one persona's experiment result into a truthful, auditable suggestion.
Every statement is derived from values the deterministic engine computed — no
invented numbers. Framed with scenario/probability/estimate language and an
explicit disclaimer. This is an educational simulation, NOT financial advice and
NOT a guarantee of returns.
"""
from __future__ import annotations

DISCLAIMER = (
    "This is a simulated, scenario-based result for research and education only. "
    "It is not financial advice, not a recommendation, and not a guarantee of "
    "returns. Asset series are simulated hypotheses, not real market data. "
    "Estimated metrics describe possible future states under the stated scenarios "
    "and probabilities, which may not occur."
)


def _pct(x: float) -> str:
    return f"{x * 100:+.1f}%"


def build_suggestion(persona_result: dict) -> dict:
    """persona_result is one entry of run_experiment()['results']."""
    bs = persona_result["portfolios"]["behavioral_scenario"]
    ew = persona_result["portfolios"]["equal_weight"]
    fit = persona_result["behavioral_portfolio_fit"]
    expl = bs["explanation"]
    m, mew = bs["metrics"], ew["metrics"]
    persona = persona_result["persona"]
    name = persona["name"]

    allocation = sorted(
        ({"asset": a, "weight": round(w, 4)} for a, w in bs["weights"].items()),
        key=lambda d: d["weight"], reverse=True,
    )
    top_scenarios = expl.get("scenarios_weighted", [])[:3]

    # dominant actions across scenarios (from the real decisions)
    action_counts: dict[str, int] = {}
    for sr in bs.get("scenario_results", []):
        action_counts[sr["action"]] = action_counts.get(sr["action"], 0) + 1
    dominant = sorted(action_counts.items(), key=lambda t: -t[1])

    why: list[str] = []
    if top_scenarios:
        names = ", ".join(f"{s['name']} (p={s['probability']:.2f})" for s in top_scenarios)
        why.append(f"Highest-probability scenarios weighed most: {names}.")
    if dominant:
        acts = ", ".join(f"{a} x{n}" for a, n in dominant)
        why.append(f"Under those scenarios the {name} profile mostly chose: {acts}.")
    tilt = expl.get("equity_tilt")
    if tilt is not None:
        why.append(
            f"The engine tilted equity by {_pct(tilt)} vs the profile's neutral target, "
            f"then computed final weights by inverse-volatility within each asset class."
        )
    cons = persona["constraints"]
    why.append(
        f"Constraints enforced: max equity {cons['maximum_equity_weight']*100:.0f}%, "
        f"min cash {cons['minimum_cash_weight']*100:.0f}%, "
        f"max single asset {cons['maximum_single_asset_weight']*100:.0f}%."
    )
    if expl.get("limited_assets"):
        why.append(f"Assets capped or removed by constraints: {', '.join(expl['limited_assets'])}.")
    if expl.get("memories_used"):
        why.append(f"Prior-experience memories informing the profile: {len(expl['memories_used'])}.")

    versus_equal_weight = {
        "volatility_delta": round(m["volatility"] - mew["volatility"], 4),
        "max_drawdown_delta": round(m["max_drawdown"] - mew["max_drawdown"], 4),
        "expected_scenario_return_delta": round(
            m["expected_scenario_return"] - mew["expected_scenario_return"], 4),
        "annualized_return_delta": round(m["annualized_return"] - mew["annualized_return"], 4),
    }

    return {
        "persona_id": persona_result["persona_id"],
        "persona_name": name,
        "objective": persona["objectives"],
        "headline": f"Simulated portfolio consistent with the {name} profile",
        "fit_score": fit.get("behavioral_portfolio_fit"),
        "fit_components": {k: fit[k] for k in (
            "persona_adherence", "risk_constraint_adherence", "liquidity_adherence",
            "behavioral_consistency", "scenario_stability", "objective_alignment") if k in fit},
        "allocation": allocation,
        "estimated_metrics": {
            "expected_scenario_return": m["expected_scenario_return"],
            "annualized_return": m["annualized_return"],
            "volatility": m["volatility"],
            "expected_drawdown": m["expected_drawdown"],
            "scenario_survival_rate": m["scenario_survival_rate"],
            "liquidity_score": m["liquidity_score"],
            "var_95": m["var_95"],
            "cvar_95": m["cvar_95"],
        },
        "versus_equal_weight": versus_equal_weight,
        "why": why,
        "remaining_risks": expl.get("remaining_risks", []),
        "constraint_violations": bs.get("constraint_violations", []),
        "scenario_decisions": bs.get("scenario_results", []),
        "disclaimer": DISCLAIMER,
    }
