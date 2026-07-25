"""Configurable, versioned scoring weights (never treated as definitive)."""
from __future__ import annotations

from dataclasses import dataclass

from .. import RISK_FORMULA_VERSION


@dataclass
class RiskWeights:
    version: str = RISK_FORMULA_VERSION
    w_tolerance: float = 0.35
    w_revealed: float = 0.45
    w_emotional: float = 0.20
