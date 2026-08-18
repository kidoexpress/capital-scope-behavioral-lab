"""FastAPI routes for the Synthetic Portfolio Lab.

Thin HTTP layer over the deterministic engine. No LLM, no real orders, no real
market data. Mounted under /api/synthetic-portfolio by main.py.
"""
from __future__ import annotations

from dataclasses import asdict

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .assets.universe import build_universe, universe_by_id
from .behavior.agent import RuleBasedPersonaAgent
from .evaluation.portfolio_metrics import evaluate_portfolio
from .experiments.config import ExperimentConfig
from .experiments.runner import run_experiment
from .explanations.suggestion import build_suggestion
from .memory.retrieval import MemoryStore, seed_memories
from .optimization.covariance import (
    diversification_ratio,
    estimate_covariance,
    portfolio_volatility,
    risk_contributions,
)
from .forecasting.portfolio_forecast import forecast_portfolio
from .personas.from_answers import persona_from_answers
from .personas.templates import PERSONA_TEMPLATES, get_persona
from .portfolios.construction import behavioral_scenario, equal_weight
from .scenarios.templates import SCENARIO_TEMPLATES, all_scenarios, get_scenario
from .scenarios.engine import normalize_probabilities

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


class ScenarioAnswer(BaseModel):
    choice: str = ""
    confidence: float = 50.0


class TwinRequest(BaseModel):
    """The guided flow's draft: what the user actually answered."""
    profile: dict[str, object] = Field(default_factory=dict)
    quiz: dict[str, float] = Field(default_factory=dict)
    scenarios: dict[str, ScenarioAnswer] = Field(default_factory=dict)
    seed: int = 42
    use_memory: bool = True
    universe_seed: int = 12345
    universe_days: int = 756


def _build_persona_and_portfolio(req: TwinRequest):
    """Shared by /twin and /forecast: same answers, same seed -> same portfolio.

    Both endpoints must agree on exactly this pipeline, or the allocation shown
    on the Portfolio step could silently differ from the one being forecast.
    """
    answers = {
        "profile": req.profile,
        "quiz": req.quiz,
        "scenarios": {k: v.model_dump() for k, v in req.scenarios.items()},
    }
    persona, provenance = persona_from_answers(answers)

    assets = build_universe(req.universe_seed, req.universe_days)
    abyid = universe_by_id(assets)
    scenarios = normalize_probabilities(all_scenarios())
    agent = RuleBasedPersonaAgent()
    store = MemoryStore(seed_memories(persona) if req.use_memory else [])

    candidate = behavioral_scenario(persona, assets, abyid, scenarios, agent, store, None)
    return persona, provenance, assets, abyid, scenarios, candidate


@router.post("/twin")
def twin(req: TwinRequest):
    """Derive a persona from the user's own answers and build their portfolio.

    ``/run`` can only score personas from the fixed template list, so the guided
    flow's answers previously had no path into the engine. This endpoint maps
    them to a Persona, runs the same deterministic construction pipeline, and
    returns the allocation together with the audit trail behind it.
    """
    persona, provenance, assets, abyid, scenarios, candidate = _build_persona_and_portfolio(req)
    baseline = equal_weight(persona, assets, abyid).weights
    metrics = evaluate_portfolio(candidate.weights, abyid, scenarios, persona, baseline=baseline)

    # Risk decomposition of the final weights — what each position actually
    # contributes to portfolio risk, rather than how big it looks.
    held = [abyid[aid] for aid in candidate.weights if aid in abyid]
    ids, sigma, cov_meta = estimate_covariance(held)
    w = np.array([candidate.weights.get(aid, 0.0) for aid in ids], dtype=float)
    if w.sum() > 0:
        w = w / w.sum()
    rc = risk_contributions(w, sigma)

    allocation = [
        {
            "asset_id": aid,
            "symbol": abyid[aid].symbol if aid in abyid else aid,
            "name": abyid[aid].name if aid in abyid else aid,
            "asset_class": abyid[aid].asset_class if aid in abyid else "cash",
            "sector": abyid[aid].sector if aid in abyid else "cash",
            "country": abyid[aid].country if aid in abyid else "",
            "weight": round(float(candidate.weights.get(aid, 0.0)), 6),
            "risk_contribution": round(float(x), 6),
        }
        for aid, x in zip(ids, rc)
    ]
    allocation.sort(key=lambda r: r["weight"], reverse=True)

    # Country breakdown excludes cash (it has no domicile) and is normalized over
    # the remaining weight, so it reads as "of what's actually invested" rather
    # than being diluted by however much sits in cash.
    invested = sum(r["weight"] for r in allocation if r["country"])
    country_breakdown: dict[str, float] = {}
    for r in allocation:
        if not r["country"]:
            continue
        country_breakdown[r["country"]] = country_breakdown.get(r["country"], 0.0) + r["weight"]
    country_weights = (
        {c: round(w / invested, 6) for c, w in sorted(country_breakdown.items(), key=lambda kv: -kv[1])}
        if invested > 0 else {}
    )

    return {
        "twin": {
            "persona_id": persona.persona_id,
            "name": persona.name,
            "behavioral_traits": asdict(persona.behavioral_traits),
            "financial_profile": asdict(persona.financial_profile),
            "constraints": asdict(persona.constraints),
            "objectives": asdict(persona.objectives),
            "provenance": provenance,
        },
        "portfolio": {
            "method": candidate.method,
            "allocation": allocation,
            "country_weights": country_weights,
            "constraint_violations": candidate.constraint_violations,
            "scenario_results": candidate.scenario_results,
            "explanation": candidate.explanation,
            "metrics": {k: round(float(v), 6) for k, v in metrics.items()},
            "risk": {
                "portfolio_volatility": round(portfolio_volatility(w, sigma), 6),
                "diversification_ratio": round(diversification_ratio(w, sigma), 4),
                "covariance": cov_meta,
            },
        },
        "disclaimer": "Simulated results on a synthetic universe. Not investment advice.",
    }


@router.post("/forecast")
def forecast(req: TwinRequest):
    """Simulate a range of outcomes for the portfolio /twin would build.

    Rebuilds the same persona and portfolio from the same answers and seed
    (deterministic, so it matches what the Portfolio step showed), then
    bootstraps the portfolio's own historical daily returns forward. The
    response is a fan of quantiles over time, never a single projected line.
    """
    persona, _provenance, _assets, abyid, _scenarios, candidate = _build_persona_and_portfolio(req)
    result = forecast_portfolio(candidate.weights, abyid, seed=req.seed)
    return {
        "method": candidate.method,
        "forecast": result,
        "portfolio_value": persona.financial_profile.portfolio_value,
        "disclaimer": "Simulated results on a synthetic universe. Not investment advice.",
    }
