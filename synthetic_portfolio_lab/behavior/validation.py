"""Deterministic validation of proposed behavioral decisions.

Agents PROPOSE; this module is part of the deterministic engine that validates
before anything is executed. Decision-level checks only (schema + coherence of
proposed allocation deltas). Portfolio-weight/constraint validation lives in
optimization/constraints.py.
"""
from __future__ import annotations

from ..schemas.enums import ACTIONS
from ..schemas.models import BehavioralDecision, ValidationResult

ALLOC_SUM_TOL = 1e-6


def validate_decision(decision: BehavioralDecision) -> ValidationResult:
    errors: list[str] = []

    if decision.action not in ACTIONS:
        errors.append(f"invalid action: {decision.action}")

    if not (0.0 <= decision.confidence <= 1.0):
        errors.append("confidence must be within [0, 1]")

    for asset, delta in decision.allocation_changes.items():
        if not isinstance(delta, (int, float)):
            errors.append(f"allocation_change for {asset} must be numeric")
        elif not (-1.0 <= float(delta) <= 1.0):
            errors.append(f"allocation_change for {asset} out of [-1, 1]")

    # Reallocation deltas should net to ~0 (a shift, not creation of wealth).
    if decision.allocation_changes:
        net = sum(float(v) for v in decision.allocation_changes.values())
        if abs(net) > 1e-3:
            errors.append(f"allocation_changes must net to ~0 (got {net:.4f})")

    if not all(isinstance(c, str) for c in decision.reason_codes):
        errors.append("reason_codes must be strings")

    return ValidationResult(valid=not errors, errors=errors)
