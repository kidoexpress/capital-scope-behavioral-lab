"""Tests: experiment replay, persona isolation, JSON export."""
from __future__ import annotations

import json

from synthetic_portfolio_lab.experiments import ExperimentConfig, run_experiment
from synthetic_portfolio_lab.repositories import export_json
from synthetic_portfolio_lab.schemas import to_dict


def _strip_time(result: dict) -> dict:
    result = json.loads(json.dumps(result))
    result["reproducibility"].pop("created_at", None)
    return result


def test_experiment_runs_and_has_structure():
    result = run_experiment(ExperimentConfig(seed=42))
    assert len(result["results"]) == 6
    assert result["aggregate"]["num_scenarios"] == 10
    for r in result["results"]:
        assert set(r["portfolios"]) == {
            "equal_weight", "risk_based", "persona_rule_based", "behavioral_scenario"}
        # weights sum to 1
        for method, pf in r["portfolios"].items():
            assert abs(sum(pf["weights"].values()) - 1.0) < 1e-6


def test_experiment_replay_same_seed():
    a = _strip_time(run_experiment(ExperimentConfig(seed=7)))
    b = _strip_time(run_experiment(ExperimentConfig(seed=7)))
    assert a == b


def test_experiment_persona_isolation():
    """Each persona's portfolio depends only on its own decisions/constraints:
    running a subset yields identical per-persona results as the full run."""
    full = run_experiment(ExperimentConfig(seed=11))
    subset = run_experiment(ExperimentConfig(seed=11, persona_keys=["contrarian_investor"]))
    full_contra = next(r for r in full["results"] if r["persona_id"] == "persona_contrarian")
    sub_contra = next(r for r in subset["results"] if r["persona_id"] == "persona_contrarian")
    assert full_contra["portfolios"]["behavioral_scenario"]["weights"] == \
        sub_contra["portfolios"]["behavioral_scenario"]["weights"]


def test_no_constraint_violations_in_experiment():
    result = run_experiment(ExperimentConfig(seed=42))
    assert result["aggregate"]["risk_violation_rate"] == 0.0


def test_json_export_round_trip(tmp_path):
    result = run_experiment(ExperimentConfig(seed=42))
    path = export_json(result, tmp_path / "out.json")
    loaded = json.loads(path.read_text())
    assert loaded["reproducibility"]["seed"] == 42
    assert to_dict(loaded) == loaded  # already plain JSON types
