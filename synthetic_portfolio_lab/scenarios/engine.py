"""Scenario Engine — build possible future states.

Supports user_defined, historical_replay, rule_based and monte_carlo generation.
Probabilities are normalized to sum to 1 (they are estimates, not predictions).
No real-time/news-based forecasting in this phase.
"""
from __future__ import annotations

from datetime import datetime, timezone

import numpy as np

from ..assets.universe import TRADING_DAYS
from ..schemas.enums import MARKET_REGIMES, SCENARIO_SOURCE_TYPES
from ..schemas.models import Asset, Scenario, ScenarioShocks
from . import templates


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_probabilities(scenarios: list[Scenario]) -> list[Scenario]:
    """Return scenarios with probabilities rescaled to sum to 1.0."""
    total = sum(max(s.probability, 0.0) for s in scenarios)
    if total <= 0:
        uniform = 1.0 / len(scenarios) if scenarios else 0.0
        for s in scenarios:
            s.probability = uniform
        return scenarios
    for s in scenarios:
        s.probability = max(s.probability, 0.0) / total
    return scenarios


def probabilities_sum(scenarios: list[Scenario]) -> float:
    return float(sum(s.probability for s in scenarios))


class ScenarioEngine:
    """Generates and manages scenarios of possible future states."""

    def from_templates(self, keys: list[str] | None = None) -> list[Scenario]:
        scenarios = (
            templates.all_scenarios()
            if keys is None
            else [templates.get_scenario(k) for k in keys]
        )
        return scenarios

    def user_defined(
        self,
        scenario_id: str,
        name: str,
        description: str,
        horizon_days: int,
        probability: float,
        market_regime: str,
        shocks: dict[str, float],
        assumptions: list[str] | None = None,
        severity: float = 0.0,
        confidence: float = 0.5,
    ) -> Scenario:
        if market_regime not in MARKET_REGIMES:
            raise ValueError(f"invalid market_regime: {market_regime}")
        return Scenario(
            scenario_id=scenario_id,
            name=name,
            description=description,
            horizon_days=horizon_days,
            probability=probability,
            market_regime=market_regime,
            shocks=ScenarioShocks(**shocks),
            assumptions=assumptions or [],
            source_type="user_defined",
            severity=severity,
            confidence=confidence,
            created_at=_now(),
            generation_method="user_defined",
        )

    def historical_replay(
        self,
        scenario_id: str,
        name: str,
        assets: list[Asset],
        window_days: int = TRADING_DAYS,
        probability: float = 0.1,
    ) -> Scenario:
        """Derive shocks from the average realized return of asset classes over a
        historical window of the (simulated) series. No future data is used."""
        by_class: dict[str, list[float]] = {}
        for a in assets:
            series = a.historical_series[-window_days:] if a.historical_series else []
            if not series:
                continue
            cum = float(np.prod([1.0 + r for r in series]) - 1.0)
            by_class.setdefault(a.asset_class, []).append(cum)

        def avg(klass: str) -> float:
            vals = by_class.get(klass, [])
            return float(np.mean(vals)) if vals else 0.0

        equity = avg("equity")
        shocks = ScenarioShocks(
            equity_return=equity,
            bond_return=avg("fixed_income"),
            commodity_return=avg("commodity"),
            volatility_change=0.0,
        )
        regime = "bull" if equity > 0.05 else "bear" if equity < -0.05 else "sideways"
        return Scenario(
            scenario_id=scenario_id,
            name=name,
            description=f"Replay historico simples ({window_days} dias)",
            horizon_days=window_days,
            probability=probability,
            market_regime=regime,
            shocks=shocks,
            source_type="historical_replay",
            severity=min(abs(equity) * 2, 1.0),
            confidence=0.5,
            created_at=_now(),
            generation_method="historical_replay",
        )

    def rule_based(
        self,
        scenario_id: str,
        regime: str,
        probability: float = 0.1,
        horizon_days: int = 90,
    ) -> Scenario:
        """Map a regime label to a documented set of shocks."""
        rules: dict[str, dict[str, float]] = {
            "bull": dict(equity_return=0.10, bond_return=-0.01, volatility_change=-0.10),
            "bear": dict(equity_return=-0.15, bond_return=0.03, volatility_change=0.30),
            "sideways": dict(equity_return=0.01, bond_return=0.01, volatility_change=0.0),
            "high_volatility": dict(equity_return=-0.05, volatility_change=0.50),
            "low_volatility": dict(equity_return=0.04, volatility_change=-0.25),
            "risk_on": dict(equity_return=0.08, commodity_return=0.05, volatility_change=-0.10),
            "risk_off": dict(equity_return=-0.10, bond_return=0.02, fx_change=0.06, volatility_change=0.30),
        }
        if regime not in rules:
            raise ValueError(f"invalid regime: {regime}")
        return Scenario(
            scenario_id=scenario_id,
            name=f"Rule-based {regime}",
            description=f"Cenario derivado de regras para o regime {regime}",
            horizon_days=horizon_days,
            probability=probability,
            market_regime=regime,
            shocks=ScenarioShocks(**rules[regime]),
            source_type="rule_based",
            severity=0.5,
            confidence=0.5,
            created_at=_now(),
            generation_method="rule_based",
        )

    def monte_carlo(
        self,
        n: int,
        seed: int,
        horizon_days: int = 90,
        equity_mu: float = 0.0,
        equity_sigma: float = 0.12,
        rate_sigma: float = 0.01,
    ) -> list[Scenario]:
        """Generate n statistical scenarios by sampling shock magnitudes.

        Deterministic given the seed (reproducible)."""
        rng = np.random.default_rng(seed)
        scenarios: list[Scenario] = []
        for i in range(n):
            eq = float(rng.normal(equity_mu, equity_sigma))
            rate = float(rng.normal(0.0, rate_sigma))
            vol = float(abs(rng.normal(0.0, 0.25)))
            regime = "bull" if eq > 0.04 else "bear" if eq < -0.04 else "sideways"
            scenarios.append(
                Scenario(
                    scenario_id=f"mc_{seed}_{i:03d}",
                    name=f"Monte Carlo {i:03d}",
                    description="Cenario estatistico amostrado (Monte Carlo)",
                    horizon_days=horizon_days,
                    probability=1.0 / n,
                    market_regime=regime,
                    shocks=ScenarioShocks(
                        equity_return=eq,
                        bond_return=float(-0.5 * rate),
                        commodity_return=float(rng.normal(0.0, 0.08)),
                        interest_rate_change=rate,
                        volatility_change=vol,
                    ),
                    source_type="statistical",
                    severity=min(abs(eq) * 2, 1.0),
                    confidence=0.4,
                    created_at=_now(),
                    generation_method="monte_carlo",
                    model_version="mc-v1",
                    seed=seed,
                )
            )
        return scenarios


__all__ = [
    "ScenarioEngine",
    "normalize_probabilities",
    "probabilities_sum",
    "SCENARIO_SOURCE_TYPES",
]
