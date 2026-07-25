"""Schemas: dataclasses, enums, JSON helper."""
from __future__ import annotations

from dataclasses import asdict, is_dataclass

from . import enums
from .models import (
    DecisionStyle,
    DimensionScore,
    FinancialContext,
    ProfileConfidence,
    QuizItem,
    QuizResponse,
    RiskProfile,
    ScenarioDefinition,
    ScenarioOption,
    ScenarioResponse,
    TwinProfile,
)


def to_dict(obj):
    if is_dataclass(obj) and not isinstance(obj, type):
        return asdict(obj)
    if isinstance(obj, list):
        return [to_dict(x) for x in obj]
    if isinstance(obj, dict):
        return {k: to_dict(v) for k, v in obj.items()}
    return obj


__all__ = [
    "enums", "to_dict",
    "QuizItem", "QuizResponse", "ScenarioDefinition", "ScenarioOption",
    "ScenarioResponse", "FinancialContext", "DimensionScore", "RiskProfile",
    "DecisionStyle", "ProfileConfidence", "TwinProfile",
]
