"""Turn the guided flow's answers into a real Persona.

Until now the API could only run personas picked from a fixed template list, so
the profile, Likert quiz and scenario answers collected by the Financial Twin
flow had nowhere to go — the engine always scored a canned persona and the
"suggestion" was the same for everyone. This module closes that gap.

Every derived value records where it came from in ``provenance`` so the Twin
step can show the user which of their own answers produced which trait, and so a
reviewer can audit the mapping instead of trusting a black box.
"""
from __future__ import annotations

from ..schemas.models import (
    BehavioralTraits,
    Demographics,
    FinancialProfile,
    Objectives,
    Persona,
    PersonaConstraints,
)

# ── quiz items whose wording runs opposite to the trait they measure ──
# The UI's `reverse` flag is defined against the item's *dimension*, not against
# the trait of the same name. "I avoid investments I do not fully understand" is
# reverse-scored for the Openness dimension, but agreeing with it means MORE
# ambiguity aversion, so it must not be flipped here. Only emotional_stability
# ("a drop stays on my mind") genuinely runs opposite to its trait.
REVERSED_ITEMS = {"emotional_stability"}

# ── profile option -> numeric ──
_HORIZON_YEARS = {"short": 2.0, "mid": 5.0, "long": 11.0, "verylong": 20.0}
_CAPITAL_VALUE = {"lt50k": 30_000.0, "50to250": 150_000.0,
                  "250to1m": 600_000.0, "gt1m": 2_000_000.0}
_LIQUIDITY_NEED = {"low": 0.15, "medium": 0.35, "high": 0.65}
_LITERACY = {"beginner": 0.25, "intermediate": 0.55, "experienced": 0.85}
_OBJECTIVE = {
    "preservation": ("capital_preservation", "income_generation"),
    "income": ("income_generation", "capital_preservation"),
    "balanced": ("balanced_growth", "capital_preservation"),
    "aggressive": ("aggressive_growth", "long_term_growth"),
}

# How each market_drop answer maps onto risk appetite (0 = flee, 1 = lean in).
_DROP_RESPONSE = {"A": 0.0, "B": 0.35, "C": 0.65, "D": 1.0, "E": 0.45}
# How each recent_rally answer maps onto trend chasing.
_RALLY_RESPONSE = {"A": 1.0, "B": 0.65, "C": 0.2, "D": 0.3}


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return float(max(lo, min(hi, x)))


def likert_to_unit(value: float, reverse: bool = False) -> float:
    """Map a 1..5 Likert answer onto 0..1, flipping reverse-worded items."""
    unit = (float(value) - 1.0) / 4.0
    return _clamp(1.0 - unit if reverse else unit)


def _quiz_scores(quiz: dict[str, float]) -> dict[str, float]:
    return {
        qid: likert_to_unit(v, qid in REVERSED_ITEMS)
        for qid, v in quiz.items()
        if v is not None
    }


def _scenario_signal(
    scenarios: dict[str, dict], scenario_id: str, table: dict[str, float]
) -> tuple[float | None, float]:
    """Return (signal in 0..1, confidence weight in 0..1) for one scenario."""
    answer = scenarios.get(scenario_id)
    if not isinstance(answer, dict):
        return None, 0.0
    signal = table.get(str(answer.get("choice", "")).upper())
    if signal is None:
        return None, 0.0
    # Confidence arrives as 0..100 from the slider; a low-confidence answer
    # should move the trait less than a decisive one.
    raw = answer.get("confidence", 50)
    conf = _clamp(float(raw) / 100.0 if float(raw) > 1.0 else float(raw))
    return float(signal), _clamp(0.35 + 0.65 * conf)


def _blend(base: float, signal: float | None, weight: float, strength: float = 0.45) -> float:
    """Pull ``base`` toward a scenario ``signal`` in proportion to confidence."""
    if signal is None or weight <= 0:
        return _clamp(base)
    k = _clamp(strength * weight)
    return _clamp((1.0 - k) * base + k * signal)


def persona_from_answers(
    answers: dict,
    persona_id: str = "twin_custom",
    name: str = "Your Financial Twin",
) -> tuple[Persona, dict]:
    """Build a Persona from the guided flow's draft. Returns (persona, provenance)."""
    profile: dict = answers.get("profile") or {}
    quiz_raw: dict = answers.get("quiz") or {}
    scenarios: dict = answers.get("scenarios") or {}

    q = _quiz_scores(quiz_raw)
    prov: dict = {"missing": [], "notes": []}

    def score(key: str, default: float = 0.5) -> float:
        if key in q:
            return q[key]
        prov["missing"].append(key)
        return default

    # ── behavioural traits ──
    loss_aversion = (score("loss_aversion") + score("reaction_to_losses")) / 2.0
    drop_signal, drop_w = _scenario_signal(scenarios, "market_drop", _DROP_RESPONSE)
    loss_aversion = _blend(loss_aversion, None if drop_signal is None else 1.0 - drop_signal, drop_w)

    herding = score("herding")
    rally_signal, rally_w = _scenario_signal(scenarios, "recent_rally", _RALLY_RESPONSE)
    herding = _blend(herding, rally_signal, rally_w)
    trend_sensitivity = _blend((herding + score("overconfidence")) / 2.0, rally_signal, rally_w)

    ai_trust = score("ai_trust", 0.4)
    ai_signal, ai_w = _scenario_signal(
        scenarios, "ai_recommendation", {"A": 1.0, "B": 0.65, "C": 0.3, "D": 0.1})
    ai_trust = _blend(ai_trust, ai_signal, ai_w)

    # Risk tolerance is not a single question — it is the goal the user chose,
    # tempered by how they said they behave when a position moves against them.
    goal = str(profile.get("goal", "balanced"))
    goal_risk = {"preservation": 0.18, "income": 0.35,
                 "balanced": 0.55, "aggressive": 0.85}.get(goal, 0.55)
    horizon_years = _HORIZON_YEARS.get(str(profile.get("horizon", "long")), 11.0)
    horizon_risk = _clamp(horizon_years / 20.0)
    discipline = (score("strategy_commitment") + score("financial_self_control")) / 2.0

    risk_tolerance = _clamp(
        0.50 * goal_risk + 0.20 * horizon_risk + 0.20 * (1.0 - loss_aversion) + 0.10 * discipline
    )
    risk_tolerance = _blend(risk_tolerance, drop_signal, drop_w, strength=0.35)

    traits = BehavioralTraits(
        risk_tolerance=round(risk_tolerance, 4),
        loss_aversion=round(loss_aversion, 4),
        trend_sensitivity=round(trend_sensitivity, 4),
        overconfidence=round(score("overconfidence", 0.3), 4),
        herding=round(herding, 4),
        ambiguity_aversion=round(score("ambiguity_aversion"), 4),
        need_for_control=round(_clamp(1.0 - 0.5 * (ai_trust + score("advisor_trust"))), 4),
        advisor_trust=round(score("advisor_trust"), 4),
        ai_trust=round(ai_trust, 4),
    )

    # ── financial profile ──
    liquidity_base = _LIQUIDITY_NEED.get(str(profile.get("liquidity", "medium")), 0.35)
    liquidity_need = _clamp(0.7 * liquidity_base + 0.3 * score("liquidity_anxiety"))
    liq_signal, liq_w = _scenario_signal(
        scenarios, "liquidity_need", {"A": 1.0, "B": 0.7, "C": 0.35, "D": 0.15})
    liquidity_need = _blend(liquidity_need, liq_signal, liq_w, strength=0.30)

    experience = str(profile.get("experience", "intermediate"))
    if "experience" not in profile:
        prov["missing"].append("experience")
    if "income_stability" not in profile:
        prov["notes"].append(
            "income_stability is not collected by the flow; defaulted to 0.5")

    fin = FinancialProfile(
        portfolio_value=_CAPITAL_VALUE.get(str(profile.get("capital", "250to1m")), 600_000.0),
        income_stability=0.5,
        investment_horizon_years=horizon_years,
        liquidity_need=round(liquidity_need, 4),
        financial_literacy=_LITERACY.get(experience, 0.55),
    )

    # ── constraints: where the behaviour becomes a hard portfolio limit ──
    primary, secondary = _OBJECTIVE.get(goal, ("balanced_growth", "capital_preservation"))

    min_cash = _clamp(0.02 + 0.28 * liquidity_need + 0.08 * loss_aversion, 0.02, 0.45)
    max_equity = _clamp(0.20 + 0.70 * risk_tolerance, 0.10, 0.95)
    # Less experienced investors get a tighter single-name cap: concentration is
    # the failure mode they are least equipped to survive.
    max_single = _clamp(0.10 + 0.25 * fin.financial_literacy, 0.08, 0.35)
    max_drawdown = _clamp(0.08 + 0.42 * (1.0 - loss_aversion) * risk_tolerance + 0.10 * horizon_risk,
                          0.05, 0.55)

    constraints = PersonaConstraints(
        minimum_cash_weight=round(min_cash, 4),
        maximum_equity_weight=round(max_equity, 4),
        maximum_single_asset_weight=round(max_single, 4),
        maximum_expected_drawdown=round(max_drawdown, 4),
        restricted_assets=[],
    )

    persona = Persona(
        persona_id=persona_id,
        name=name,
        demographics=Demographics(),
        financial_profile=fin,
        behavioral_traits=traits,
        objectives=Objectives(primary=primary, secondary=secondary),
        constraints=constraints,
    )

    prov.update({
        "answered": {"quiz": len(q), "scenarios": len(scenarios), "profile": len(profile)},
        "drivers": {
            "risk_tolerance": [
                f"goal='{goal}' (50%)", f"horizon={horizon_years:.0f}y (20%)",
                "loss aversion, inverted (20%)", "discipline answers (10%)",
                *( [f"market_drop scenario, confidence-weighted"] if drop_signal is not None else [] ),
            ],
            "loss_aversion": ["loss_aversion + reaction_to_losses items",
                              *(["market_drop scenario"] if drop_signal is not None else [])],
            "herding": ["herding item",
                        *(["recent_rally scenario"] if rally_signal is not None else [])],
            "minimum_cash_weight": [f"liquidity='{profile.get('liquidity', 'medium')}'",
                                    "liquidity_anxiety item", "loss aversion"],
            "maximum_equity_weight": ["risk tolerance"],
            "maximum_single_asset_weight": [f"experience='{experience}'"],
        },
    })
    return persona, prov
