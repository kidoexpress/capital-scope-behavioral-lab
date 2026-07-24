"""Persona / behavioral evaluation metrics.

Includes behavioral separation: decisions are turned into vectors, personas are
represented by their centroids, and a nearest-centroid classifier recovers the
persona from a decision — compared against a random baseline (1/K).
"""
from __future__ import annotations

import numpy as np

from ..schemas.enums import ACTIONS
from ..schemas.models import BehavioralDecision

_ACTION_INDEX = {a: i for i, a in enumerate(sorted(ACTIONS))}


def action_entropy(decisions: list[BehavioralDecision]) -> float:
    if not decisions:
        return 0.0
    counts: dict[str, int] = {}
    for d in decisions:
        counts[d.action] = counts.get(d.action, 0) + 1
    p = np.array(list(counts.values()), float)
    p = p / p.sum()
    ent = -float((p * np.log2(p)).sum())
    return ent


def decision_consistency(decisions: list[BehavioralDecision]) -> float:
    """1 - normalized action entropy (1.0 == always the same action)."""
    if len(decisions) <= 1:
        return 1.0
    max_ent = np.log2(len(set(d.action for d in decisions)) or 1)
    if max_ent <= 0:
        return 1.0
    return float(1.0 - action_entropy(decisions) / max_ent)


def strategy_switch_rate(decisions: list[BehavioralDecision]) -> float:
    if len(decisions) <= 1:
        return 0.0
    switches = sum(1 for a, b in zip(decisions, decisions[1:]) if a.action != b.action)
    return float(switches / (len(decisions) - 1))


def scenario_sensitivity(decisions: list[BehavioralDecision]) -> float:
    """Dispersion of the equity delta across scenarios (0 == insensitive)."""
    if not decisions:
        return 0.0
    deltas = np.array([d.allocation_changes.get("equity", 0.0) for d in decisions])
    return float(deltas.std())


def memory_influence_score(
    with_memory: list[BehavioralDecision], without_memory: list[BehavioralDecision]
) -> float:
    """Fraction of scenarios where memory changed the action or the equity delta."""
    if not with_memory:
        return 0.0
    changed = 0
    for a, b in zip(with_memory, without_memory):
        if a.action != b.action or abs(
            a.allocation_changes.get("equity", 0.0) - b.allocation_changes.get("equity", 0.0)
        ) > 1e-6:
            changed += 1
    return float(changed / len(with_memory))


def risk_violation_rate(violation_lists: list[list[str]]) -> float:
    if not violation_lists:
        return 0.0
    return float(sum(1 for v in violation_lists if v) / len(violation_lists))


def _decision_vector(d: BehavioralDecision) -> list[float]:
    return [
        d.allocation_changes.get("equity", 0.0),
        d.confidence,
        float(_ACTION_INDEX.get(d.action, 0)) / len(ACTIONS),
        1.0 if d.request_human_review else 0.0,
    ]


def behavioral_separation(decisions_by_persona: dict[str, list[BehavioralDecision]]) -> dict[str, float]:
    """Mean pairwise distance between persona decision vectors + nearest-centroid
    classification accuracy vs a random baseline (1/K)."""
    pids = list(decisions_by_persona)
    k = len(pids)
    if k < 2:
        return {"mean_pairwise_distance": 0.0, "classification_accuracy": 1.0,
                "random_baseline": 1.0}

    # per-persona centroid over its scenario decision vectors
    centroids = {
        pid: np.mean([_decision_vector(d) for d in decs], axis=0)
        for pid, decs in decisions_by_persona.items() if decs
    }
    cvals = list(centroids.values())
    dists = [float(np.linalg.norm(cvals[i] - cvals[j]))
             for i in range(len(cvals)) for j in range(i + 1, len(cvals))]
    mean_pairwise = float(np.mean(dists)) if dists else 0.0

    # classify each (persona, scenario) decision to the nearest centroid
    correct = total = 0
    cpids = list(centroids)
    cmat = np.array([centroids[p] for p in cpids])
    for pid, decs in decisions_by_persona.items():
        if pid not in centroids:
            continue
        for d in decs:
            v = np.array(_decision_vector(d))
            pred = cpids[int(np.argmin(np.linalg.norm(cmat - v, axis=1)))]
            correct += int(pred == pid)
            total += 1
    accuracy = float(correct / total) if total else 0.0
    return {
        "mean_pairwise_distance": mean_pairwise,
        "classification_accuracy": accuracy,
        "random_baseline": float(1.0 / k),
    }
