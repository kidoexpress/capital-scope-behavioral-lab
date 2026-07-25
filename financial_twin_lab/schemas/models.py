"""Core dataclasses for the Financial Twin Lab (JSON-serializable via asdict)."""
from __future__ import annotations

from dataclasses import dataclass, field


# ─────────────── Quiz ───────────────
@dataclass
class QuizItem:
    question_id: str
    module: str            # A|B|C|D
    dimension: str
    text: str
    reverse_scored: bool = False
    type: str = "likert_5"
    weight: float = 1.0
    sensitive: bool = False


@dataclass
class QuizResponse:
    question_id: str
    value: int             # 1..5 Likert
    response_time_ms: int = 0


@dataclass
class ScenarioOption:
    key: str               # e.g. "A"
    text: str
    action: str            # one of TWIN_ACTIONS
    risk_behavior: float   # 0..1 revealed risk of this choice


@dataclass
class ScenarioDefinition:
    scenario_id: str
    title: str
    prompt: str
    options: list[ScenarioOption]
    tags: list[str] = field(default_factory=list)


@dataclass
class ScenarioResponse:
    scenario_id: str
    choice: str                     # option key
    intensity: float = 0.5          # 0..1
    confidence: float = 0.5         # 0..1
    response_time_ms: int = 0
    requested_info: bool = False
    changed_after_info: bool = False
    changed_after_social: bool = False


# ─────────────── Financial context ───────────────
@dataclass
class FinancialContext:
    currency: str = "BRL"
    investable_assets: float = 100_000.0
    monthly_income_range: str = "5000_10000"
    income_stability: float = 0.6         # 0..1
    monthly_expenses: float = 5_000.0
    emergency_reserve_months: float = 3.0
    debt_amount: float = 0.0
    debt_cost: float = 0.0                # annual rate
    dependents: int = 0
    investment_horizon_months: int = 120
    liquidity_need: float = 0.3           # 0..1
    financial_literacy: float = 0.5       # 0..1
    investment_experience: float = 0.5    # 0..1
    max_bearable_loss: float = 0.25       # fraction of portfolio
    allowed_asset_classes: list[str] = field(default_factory=list)   # empty = all
    restricted_asset_classes: list[str] = field(default_factory=list)
    home_bias: float = 0.5                # 0 international .. 1 domestic
    contribution_frequency: str = "monthly"


# ─────────────── Scores ───────────────
@dataclass
class DimensionScore:
    dimension: str
    score: float                  # 0..1
    n_items: int = 0
    confidence: float = 0.5       # 0..1
    insufficient_data: bool = False


# ─────────────── Twin profile ───────────────
@dataclass
class RiskProfile:
    risk_capacity: float
    risk_tolerance: float
    revealed_risk_behavior: float
    effective_risk_budget: float
    declared_vs_revealed_gap: float


@dataclass
class DecisionStyle:
    primary_style: str = "balanced"
    advisor_dependence: float = 0.5
    ai_trust: float = 0.4
    monitoring_frequency: str = "monthly"
    stress_sensitivity: float = 0.5


@dataclass
class ProfileConfidence:
    overall: float = 0.5
    low_confidence_dimensions: list[str] = field(default_factory=list)


@dataclass
class TwinProfile:
    twin_id: str
    user_id: str
    profile_version: str
    quiz_version: str
    scoring_version: str
    financial_context: FinancialContext
    personality: dict[str, float]
    behavioral_traits: dict[str, float]
    consumption_traits: dict[str, float]
    investing_traits: dict[str, float]
    risk_profile: RiskProfile
    decision_style: DecisionStyle
    confidence: ProfileConfidence
    response_consistency: float = 0.5
    created_at: str = ""
