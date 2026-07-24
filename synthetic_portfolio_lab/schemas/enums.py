"""Controlled vocabularies for the Synthetic Portfolio Lab.

Stored as plain strings on dataclasses (so ``dataclasses.asdict`` stays
JSON-serializable) and validated against these frozensets.
"""
from __future__ import annotations

# Structured behavioral actions an agent may propose.
ACTIONS = frozenset({
    "BUY",
    "SELL",
    "HOLD",
    "INCREASE_RISK",
    "REDUCE_RISK",
    "MOVE_TO_CASH",
    "REBALANCE",
    "REQUEST_HUMAN_REVIEW",
    "REQUEST_MORE_INFORMATION",
})

ASSET_CLASSES = frozenset({"equity", "fixed_income", "etf", "commodity", "cash"})

MARKET_REGIMES = frozenset({
    "bull",
    "bear",
    "sideways",
    "high_volatility",
    "low_volatility",
    "risk_on",
    "risk_off",
})

SCENARIO_SOURCE_TYPES = frozenset({
    "user_defined",
    "historical_replay",
    "rule_based",
    "statistical",
    "model_generated",
    "hybrid",
})

MEMORY_TYPES = frozenset({
    "episodic",
    "semantic",
    "decision",
    "outcome",
    "relational",
})

PORTFOLIO_METHODS = frozenset({
    "equal_weight",
    "risk_based",
    "persona_rule_based",
    "behavioral_scenario",
})

FORECAST_METHODS = frozenset({
    "historical_mean",
    "rolling_mean",
    "historical_bootstrap",
    "monte_carlo",
    "regime_based",
})

CASH_ASSET_ID = "CASH"
