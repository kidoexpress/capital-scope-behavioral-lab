"""Controlled vocabularies for the Financial Twin Lab (validated string fields)."""
from __future__ import annotations

LIKERT_MIN = 1
LIKERT_MAX = 5

QUIZ_MODULES = frozenset({"A", "B", "C", "D"})  # BigFive, FinBehavior, Consumption, Investing

BIG_FIVE = ("openness", "conscientiousness", "extraversion",
            "agreeableness", "emotional_stability")

FINANCIAL_BEHAVIOR_DIMS = (
    "loss_aversion", "ambiguity_aversion", "present_bias", "overconfidence",
    "herding", "status_quo_bias", "anchoring", "disposition_effect",
    "mental_accounting", "regret_aversion", "financial_self_control",
    "savings_discipline", "liquidity_anxiety", "debt_comfort",
    "advisor_trust", "ai_trust",
)

CONSUMPTION_DIMS = (
    "impulsive_spending", "status_consumption", "discount_sensitivity",
    "planned_consumption", "future_orientation", "emergency_preparedness",
    "lifestyle_inflation", "subscription_awareness", "credit_dependence",
    "spending_regret",
)

INVESTING_DIMS = (
    "monitoring_frequency", "trading_impulsivity", "strategy_commitment",
    "information_seeking", "source_dependence", "reaction_to_news",
    "reaction_to_losses", "reaction_to_gains", "diversification_preference",
    "concentration_preference",
)

# Twin behavioral actions (probabilities must sum to 1).
TWIN_ACTIONS = frozenset({
    "SELL", "PARTIAL_DE_RISK", "HOLD", "BUY", "REQUEST_REVIEW",
})

MEMORY_TYPES = frozenset({
    "quiz", "scenario_decision", "decision", "outcome", "reflection", "portfolio",
})

# Sensitive fields that are OPTIONAL and MUST NOT affect the portfolio.
SENSITIVE_FIELDS = frozenset({
    "race", "religion", "sexual_orientation", "medical_diagnosis",
    "health_data", "political_opinion",
})
