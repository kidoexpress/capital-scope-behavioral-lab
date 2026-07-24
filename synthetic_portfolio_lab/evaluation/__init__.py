"""Evaluation & Explanation Engine: portfolio, persona and fit metrics."""
from .fit import FitWeights, behavioral_portfolio_fit
from .persona_metrics import (
    action_entropy,
    behavioral_separation,
    decision_consistency,
    memory_influence_score,
    risk_violation_rate,
    scenario_sensitivity,
    strategy_switch_rate,
)
from .portfolio_metrics import (
    evaluate_portfolio,
    path_metrics,
    scenario_metrics,
    scenario_return,
    turnover,
)

__all__ = [
    "FitWeights",
    "behavioral_portfolio_fit",
    "evaluate_portfolio",
    "path_metrics",
    "scenario_metrics",
    "scenario_return",
    "turnover",
    "action_entropy",
    "decision_consistency",
    "strategy_switch_rate",
    "scenario_sensitivity",
    "memory_influence_score",
    "risk_violation_rate",
    "behavioral_separation",
]
