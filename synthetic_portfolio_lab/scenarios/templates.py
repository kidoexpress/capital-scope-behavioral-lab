"""Ten editable scenario templates for the MVP.

Each scenario is a hypothesis about a possible future state — probabilities,
shocks and severity are estimates, not predictions.
"""
from __future__ import annotations

from ..schemas.models import Scenario, ScenarioShocks


def _s(sid, name, desc, horizon, prob, regime, severity, confidence, **shocks) -> Scenario:
    return Scenario(
        scenario_id=sid,
        name=name,
        description=desc,
        horizon_days=horizon,
        probability=prob,
        market_regime=regime,
        shocks=ScenarioShocks(**shocks),
        source_type="rule_based",
        severity=severity,
        confidence=confidence,
        generation_method="template",
    )


def base_case() -> Scenario:
    return _s("scenario_base", "Base Case", "Continuidade das condicoes atuais",
              90, 0.30, "sideways", 0.1, 0.6,
              equity_return=0.02, bond_return=0.01, commodity_return=0.01,
              volatility_change=0.0)


def bull_market() -> Scenario:
    return _s("scenario_bull", "Bull Market", "Valorizacao ampla das acoes",
              90, 0.15, "bull", 0.2, 0.5,
              equity_return=0.12, bond_return=-0.01, commodity_return=0.03,
              volatility_change=-0.15, interest_rate_change=0.0025)


def bear_market() -> Scenario:
    return _s("scenario_bear", "Bear Market", "Queda ampla e persistente das acoes",
              90, 0.12, "bear", 0.7, 0.5,
              equity_return=-0.15, bond_return=0.03, commodity_return=-0.05,
              volatility_change=0.35, fx_change=0.05)


def interest_rate_shock() -> Scenario:
    return _s("scenario_rate_shock", "Interest Rate Shock",
              "Aumento inesperado da taxa de juros",
              90, 0.10, "risk_off", 0.6, 0.55,
              interest_rate_change=0.02, inflation_change=0.005,
              equity_return=-0.12, bond_return=-0.03, commodity_return=0.04,
              fx_change=0.09, volatility_change=0.35)


def inflation_shock() -> Scenario:
    return _s("scenario_inflation", "Inflation Shock",
              "Inflacao acima do esperado",
              120, 0.08, "risk_off", 0.55, 0.5,
              inflation_change=0.03, interest_rate_change=0.01,
              equity_return=-0.08, bond_return=-0.05, commodity_return=0.10,
              volatility_change=0.20)


def liquidity_crisis() -> Scenario:
    return _s("scenario_liquidity", "Liquidity Crisis",
              "Estresse de liquidez e fuga para caixa",
              60, 0.05, "risk_off", 0.9, 0.4,
              equity_return=-0.20, bond_return=-0.02, commodity_return=-0.08,
              fx_change=0.12, volatility_change=0.55, interest_rate_change=0.005)


def technology_bubble() -> Scenario:
    return _s("scenario_tech_bubble", "Technology Bubble",
              "Valorizacao rapida e concentrada de acoes de tecnologia",
              90, 0.06, "bull", 0.4, 0.4,
              equity_return=0.18, bond_return=-0.02, commodity_return=0.0,
              volatility_change=0.10)


def commodity_boom() -> Scenario:
    return _s("scenario_commodity", "Commodity Boom",
              "Alta forte de commodities",
              120, 0.05, "risk_on", 0.3, 0.45,
              commodity_return=0.20, inflation_change=0.015,
              equity_return=0.03, bond_return=-0.02, volatility_change=0.05)


def currency_depreciation() -> Scenario:
    return _s("scenario_fx", "Currency Depreciation",
              "Depreciacao acentuada da moeda local / alta do dolar",
              90, 0.05, "risk_off", 0.5, 0.45,
              fx_change=0.15, inflation_change=0.01, equity_return=-0.05,
              commodity_return=0.06, volatility_change=0.20)


def recession() -> Scenario:
    return _s("scenario_recession", "Recession",
              "Contracao economica ampla",
              180, 0.04, "bear", 0.85, 0.45,
              equity_return=-0.22, bond_return=0.05, commodity_return=-0.10,
              interest_rate_change=-0.015, volatility_change=0.40, fx_change=0.04)


SCENARIO_TEMPLATES = {
    "base_case": base_case,
    "bull_market": bull_market,
    "bear_market": bear_market,
    "interest_rate_shock": interest_rate_shock,
    "inflation_shock": inflation_shock,
    "liquidity_crisis": liquidity_crisis,
    "technology_bubble": technology_bubble,
    "commodity_boom": commodity_boom,
    "currency_depreciation": currency_depreciation,
    "recession": recession,
}


def all_scenarios() -> list[Scenario]:
    return [factory() for factory in SCENARIO_TEMPLATES.values()]


def get_scenario(key: str) -> Scenario:
    if key not in SCENARIO_TEMPLATES:
        raise KeyError(f"unknown scenario template: {key}")
    return SCENARIO_TEMPLATES[key]()
