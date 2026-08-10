"""Core domain dataclasses for the Synthetic Portfolio Lab.

All models are plain ``@dataclass`` objects with string/number/list/dict fields
so ``dataclasses.asdict`` produces JSON-serializable output for export.
"""
from __future__ import annotations

from dataclasses import dataclass, field


# ─────────────────────────── Assets ───────────────────────────
@dataclass
class Asset:
    asset_id: str
    symbol: str
    asset_class: str
    expected_return: float          # annualized, decimal (e.g. 0.08)
    volatility: float               # annualized, decimal
    liquidity: float                # 0..1
    risk_score: float               # 0..1
    currency: str
    sector: str
    minimum_weight: float = 0.0
    maximum_weight: float = 1.0
    allowed_personas: list[str] = field(default_factory=list)  # empty = all
    historical_series: list[float] = field(default_factory=list)  # daily returns
    name: str = ""                  # full instrument/company name, e.g. "Apple Inc."
    country: str = ""               # domicile/listing country; "" for cash


# ─────────────────────────── Personas ───────────────────────────
@dataclass
class Demographics:
    age_range: str = ""
    occupation_type: str = ""


@dataclass
class FinancialProfile:
    portfolio_value: float = 1_000_000.0
    income_stability: float = 0.5
    investment_horizon_years: float = 10.0
    liquidity_need: float = 0.3
    financial_literacy: float = 0.5


@dataclass
class BehavioralTraits:
    risk_tolerance: float = 0.5
    loss_aversion: float = 0.5
    trend_sensitivity: float = 0.5
    overconfidence: float = 0.3
    herding: float = 0.3
    ambiguity_aversion: float = 0.5
    need_for_control: float = 0.5
    advisor_trust: float = 0.5
    ai_trust: float = 0.4


@dataclass
class Objectives:
    primary: str = "balanced_growth"
    secondary: str = "capital_preservation"


@dataclass
class PersonaConstraints:
    minimum_cash_weight: float = 0.0
    maximum_equity_weight: float = 1.0
    maximum_single_asset_weight: float = 1.0
    maximum_expected_drawdown: float = 0.50
    restricted_assets: list[str] = field(default_factory=list)


@dataclass
class PersonaDynamicState:
    stress: float = 0.2
    confidence: float = 0.6
    recent_loss: float = 0.0
    recent_gain: float = 0.0
    current_strategy: str = "balanced"


@dataclass
class MemoryConfig:
    """Configurable memory-retrieval weights (see memory/retrieval.py)."""
    enabled: bool = True
    memory_length: int = 5          # how many memories to retrieve
    relevance_weight: float = 0.30
    recency_weight: float = 0.20
    importance_weight: float = 0.20
    emotion_weight: float = 0.10
    objective_weight: float = 0.10
    reliability_weight: float = 0.10


@dataclass
class Persona:
    persona_id: str
    name: str
    demographics: Demographics = field(default_factory=Demographics)
    financial_profile: FinancialProfile = field(default_factory=FinancialProfile)
    behavioral_traits: BehavioralTraits = field(default_factory=BehavioralTraits)
    objectives: Objectives = field(default_factory=Objectives)
    constraints: PersonaConstraints = field(default_factory=PersonaConstraints)
    dynamic_state: PersonaDynamicState = field(default_factory=PersonaDynamicState)
    memory_config: MemoryConfig = field(default_factory=MemoryConfig)


# ─────────────────────────── Memory ───────────────────────────
@dataclass
class Memory:
    memory_id: str
    persona_id: str
    type: str                       # one of enums.MEMORY_TYPES
    content: str
    created_at: str = ""
    importance: float = 5.0         # 0..10
    emotional_valence: float = 0.0  # -1..1
    reliability: float = 1.0        # 0..1
    related_assets: list[str] = field(default_factory=list)
    related_scenarios: list[str] = field(default_factory=list)
    supporting_event_ids: list[str] = field(default_factory=list)


# ─────────────────────────── Scenarios ───────────────────────────
@dataclass
class ScenarioShocks:
    interest_rate_change: float = 0.0
    inflation_change: float = 0.0
    equity_return: float = 0.0
    bond_return: float = 0.0
    commodity_return: float = 0.0
    fx_change: float = 0.0
    volatility_change: float = 0.0


@dataclass
class Scenario:
    scenario_id: str
    name: str
    description: str
    horizon_days: int
    probability: float
    market_regime: str
    shocks: ScenarioShocks = field(default_factory=ScenarioShocks)
    assumptions: list[str] = field(default_factory=list)
    source_type: str = "user_defined"
    severity: float = 0.0           # 0..1
    confidence: float = 0.5         # 0..1
    created_at: str = ""
    generation_method: str = "template"
    model_version: str = "v1"
    seed: int = 0


# ─────────────────────────── Forecast ───────────────────────────
@dataclass
class Forecast:
    asset_id: str
    horizon_days: int
    expected_return: float
    median_return: float
    volatility: float
    downside_probability: float
    quantiles: dict[str, float]     # keys: p05,p25,p50,p75,p95
    confidence: float
    method: str
    assumptions: list[str] = field(default_factory=list)
    model_version: str = "v1"


# ─────────────────────────── Behavioral decision ───────────────────────────
@dataclass
class BehavioralDecision:
    persona_id: str
    scenario_id: str
    action: str
    target_assets: list[str] = field(default_factory=list)
    allocation_changes: dict[str, float] = field(default_factory=dict)
    confidence: float = 0.5
    request_human_review: bool = False
    reason_codes: list[str] = field(default_factory=list)
    memories_used: list[str] = field(default_factory=list)
    expected_behavioral_effect: dict[str, float] = field(default_factory=dict)


# ─────────────────────────── Portfolio ───────────────────────────
@dataclass
class PortfolioCandidate:
    portfolio_id: str
    persona_id: str
    method: str
    weights: dict[str, float] = field(default_factory=dict)
    expected_metrics: dict[str, float] = field(default_factory=dict)
    behavioral_metrics: dict[str, float] = field(default_factory=dict)
    constraint_violations: list[str] = field(default_factory=list)
    scenario_results: list[dict] = field(default_factory=list)
    explanation: dict = field(default_factory=dict)


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)
    adjustments: list[str] = field(default_factory=list)
