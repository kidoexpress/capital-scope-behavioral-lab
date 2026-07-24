"""Six initial synthetic-investor persona templates (PRODUCT_SPEC).

Decisions are driven mainly by objectives, constraints, prior behavior, memory,
losses/gains, confidence, horizon, liquidity need and behavioral traits — not by
demographics alone.
"""
from __future__ import annotations

from ..schemas.models import (
    BehavioralTraits,
    Demographics,
    FinancialProfile,
    MemoryConfig,
    Objectives,
    Persona,
    PersonaConstraints,
    PersonaDynamicState,
)


def _persona(**kw) -> Persona:
    return Persona(**kw)


def conservative_wealth_preserver() -> Persona:
    return _persona(
        persona_id="persona_conservative",
        name="Conservative Wealth Preserver",
        demographics=Demographics("55-64", "business_owner"),
        financial_profile=FinancialProfile(5_000_000, 0.8, 10, 0.5, 0.7),
        behavioral_traits=BehavioralTraits(
            risk_tolerance=0.25, loss_aversion=0.85, trend_sensitivity=0.15,
            overconfidence=0.20, herding=0.30, ambiguity_aversion=0.75,
            need_for_control=0.80, advisor_trust=0.70, ai_trust=0.35),
        objectives=Objectives("capital_preservation", "income_generation"),
        constraints=PersonaConstraints(0.10, 0.40, 0.10, 0.12, []),
        dynamic_state=PersonaDynamicState(0.20, 0.60, current_strategy="defensive"),
        memory_config=MemoryConfig(memory_length=5),
    )


def long_term_fundamentalist() -> Persona:
    return _persona(
        persona_id="persona_fundamentalist",
        name="Long-Term Fundamentalist",
        demographics=Demographics("40-54", "professional"),
        financial_profile=FinancialProfile(2_000_000, 0.7, 20, 0.2, 0.85),
        behavioral_traits=BehavioralTraits(
            risk_tolerance=0.55, loss_aversion=0.45, trend_sensitivity=0.10,
            overconfidence=0.35, herding=0.15, ambiguity_aversion=0.40,
            need_for_control=0.55, advisor_trust=0.50, ai_trust=0.45),
        objectives=Objectives("long_term_growth", "capital_preservation"),
        constraints=PersonaConstraints(0.05, 0.75, 0.20, 0.30, []),
        dynamic_state=PersonaDynamicState(0.15, 0.70, current_strategy="value"),
        memory_config=MemoryConfig(memory_length=5),
    )


def trend_following_growth_investor() -> Persona:
    return _persona(
        persona_id="persona_trend",
        name="Trend-Following Growth Investor",
        demographics=Demographics("30-39", "tech_worker"),
        financial_profile=FinancialProfile(750_000, 0.6, 15, 0.25, 0.6),
        behavioral_traits=BehavioralTraits(
            risk_tolerance=0.80, loss_aversion=0.30, trend_sensitivity=0.90,
            overconfidence=0.60, herding=0.65, ambiguity_aversion=0.30,
            need_for_control=0.40, advisor_trust=0.35, ai_trust=0.65),
        objectives=Objectives("aggressive_growth", "momentum_capture"),
        constraints=PersonaConstraints(0.02, 0.95, 0.30, 0.45, []),
        dynamic_state=PersonaDynamicState(0.25, 0.75, current_strategy="momentum"),
        memory_config=MemoryConfig(memory_length=3),
    )


def contrarian_investor() -> Persona:
    return _persona(
        persona_id="persona_contrarian",
        name="Contrarian Investor",
        demographics=Demographics("40-54", "portfolio_manager"),
        financial_profile=FinancialProfile(1_500_000, 0.65, 12, 0.2, 0.8),
        behavioral_traits=BehavioralTraits(
            risk_tolerance=0.65, loss_aversion=0.40, trend_sensitivity=-0.70,
            overconfidence=0.55, herding=0.10, ambiguity_aversion=0.35,
            need_for_control=0.60, advisor_trust=0.40, ai_trust=0.50),
        objectives=Objectives("mean_reversion", "long_term_growth"),
        constraints=PersonaConstraints(0.05, 0.85, 0.25, 0.35, []),
        dynamic_state=PersonaDynamicState(0.20, 0.65, current_strategy="contrarian"),
        memory_config=MemoryConfig(memory_length=5),
    )


def income_oriented_investor() -> Persona:
    return _persona(
        persona_id="persona_income",
        name="Income-Oriented Investor",
        demographics=Demographics("60-69", "retiree"),
        financial_profile=FinancialProfile(1_200_000, 0.9, 8, 0.6, 0.6),
        behavioral_traits=BehavioralTraits(
            risk_tolerance=0.35, loss_aversion=0.70, trend_sensitivity=0.20,
            overconfidence=0.25, herding=0.35, ambiguity_aversion=0.65,
            need_for_control=0.65, advisor_trust=0.65, ai_trust=0.35),
        objectives=Objectives("income_generation", "capital_preservation"),
        constraints=PersonaConstraints(0.08, 0.50, 0.15, 0.15, []),
        dynamic_state=PersonaDynamicState(0.20, 0.60, current_strategy="income"),
        memory_config=MemoryConfig(memory_length=5),
    )


def high_confidence_concentrated_investor() -> Persona:
    return _persona(
        persona_id="persona_concentrated",
        name="High-Confidence Concentrated Investor",
        demographics=Demographics("35-44", "entrepreneur"),
        financial_profile=FinancialProfile(3_000_000, 0.5, 18, 0.15, 0.7),
        behavioral_traits=BehavioralTraits(
            risk_tolerance=0.90, loss_aversion=0.25, trend_sensitivity=0.55,
            overconfidence=0.85, herding=0.20, ambiguity_aversion=0.20,
            need_for_control=0.85, advisor_trust=0.25, ai_trust=0.55),
        objectives=Objectives("aggressive_growth", "conviction_bets"),
        constraints=PersonaConstraints(0.00, 1.00, 0.50, 0.60, []),
        dynamic_state=PersonaDynamicState(0.30, 0.85, current_strategy="concentrated"),
        memory_config=MemoryConfig(memory_length=3),
    )


PERSONA_TEMPLATES = {
    "conservative_wealth_preserver": conservative_wealth_preserver,
    "long_term_fundamentalist": long_term_fundamentalist,
    "trend_following_growth_investor": trend_following_growth_investor,
    "contrarian_investor": contrarian_investor,
    "income_oriented_investor": income_oriented_investor,
    "high_confidence_concentrated_investor": high_confidence_concentrated_investor,
}


def all_personas() -> list[Persona]:
    return [factory() for factory in PERSONA_TEMPLATES.values()]


def get_persona(key: str) -> Persona:
    if key not in PERSONA_TEMPLATES:
        raise KeyError(f"unknown persona template: {key}")
    return PERSONA_TEMPLATES[key]()
