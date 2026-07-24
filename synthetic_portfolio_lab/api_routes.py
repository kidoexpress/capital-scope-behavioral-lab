"""FastAPI routes for the Synthetic Portfolio Lab.

Thin HTTP layer over the deterministic engine. No LLM, no real orders, no real
market data. Mounted under /api/synthetic-portfolio by main.py.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .experiments.config import ExperimentConfig
from .experiments.runner import run_experiment
from .explanations.suggestion import build_suggestion
from .personas.templates import PERSONA_TEMPLATES, get_persona
from .scenarios.templates import SCENARIO_TEMPLATES, get_scenario

router = APIRouter(prefix="/synthetic-portfolio", tags=["synthetic-portfolio-lab"])


class RunRequest(BaseModel):
    seed: int = 42
    persona_keys: list[str] = Field(default_factory=list)   # empty -> all
    scenario_keys: list[str] = Field(default_factory=list)  # empty -> all
    use_memory: bool = True
    universe_seed: int = 12345
    universe_days: int = 756


@router.get("/templates")
def templates():
    return {
        "personas": [{"key": k, "name": get_persona(k).name} for k in PERSONA_TEMPLATES],
        "scenarios": [{"key": k, "name": get_scenario(k).name,
                       "regime": get_scenario(k).market_regime} for k in SCENARIO_TEMPLATES],
    }


@router.post("/run")
def run(req: RunRequest):
    for k in req.persona_keys:
        if k not in PERSONA_TEMPLATES:
            raise HTTPException(400, f"unknown persona: {k}")
    for k in req.scenario_keys:
        if k not in SCENARIO_TEMPLATES:
            raise HTTPException(400, f"unknown scenario: {k}")

    config = ExperimentConfig(
        experiment_id="ui_run",
        seed=req.seed,
        persona_keys=req.persona_keys,
        scenario_keys=req.scenario_keys or None,
        use_memory=req.use_memory,
        universe_seed=req.universe_seed,
        universe_days=req.universe_days,
    )
    result = run_experiment(config)
    suggestions = [build_suggestion(r) for r in result["results"]]
    return {
        "reproducibility": result["reproducibility"],
        "behavioral_separation": result["behavioral_separation"],
        "aggregate": result["aggregate"],
        "suggestions": suggestions,
    }
