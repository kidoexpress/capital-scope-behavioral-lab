"""Experiment configuration (reproducible by construction)."""
from __future__ import annotations

from dataclasses import dataclass, field

from ..evaluation.fit import FitWeights


@dataclass
class ExperimentConfig:
    experiment_id: str = "exp_default"
    seed: int = 42
    persona_keys: list[str] = field(default_factory=list)   # empty -> all templates
    scenario_keys: list[str] | None = None                  # None -> all templates
    horizon_days: int = 90
    universe_seed: int = 12345
    universe_days: int = 756
    use_memory: bool = True
    intervention: dict | None = None
    fit_weights: FitWeights = field(default_factory=FitWeights)
