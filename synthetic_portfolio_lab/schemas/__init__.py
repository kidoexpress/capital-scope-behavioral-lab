"""Schemas: dataclasses, enums, and JSON serialization helpers."""
from __future__ import annotations

from dataclasses import asdict, is_dataclass

from . import enums
from .models import (
    Asset,
    BehavioralDecision,
    BehavioralTraits,
    Demographics,
    FinancialProfile,
    Forecast,
    Memory,
    MemoryConfig,
    Objectives,
    Persona,
    PersonaConstraints,
    PersonaDynamicState,
    PortfolioCandidate,
    Scenario,
    ScenarioShocks,
    ValidationResult,
)


def to_dict(obj):
    """Recursively convert a dataclass (or list/dict of them) to plain JSON types."""
    if is_dataclass(obj) and not isinstance(obj, type):
        return asdict(obj)
    if isinstance(obj, list):
        return [to_dict(x) for x in obj]
    if isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
    return obj


__all__ = [
    "enums",
    "to_dict",
    "Asset",
    "BehavioralDecision",
    "BehavioralTraits",
    "Demographics",
    "FinancialProfile",
    "Forecast",
    "Memory",
    "MemoryConfig",
    "Objectives",
    "Persona",
    "PersonaConstraints",
    "PersonaDynamicState",
    "PortfolioCandidate",
    "Scenario",
    "ScenarioShocks",
    "ValidationResult",
]
