"""Versioned quiz definition bundle."""
from __future__ import annotations

from dataclasses import dataclass, field

from .. import QUIZ_VERSION
from ..schemas.models import QuizItem, ScenarioDefinition
from .items import CORE_ITEMS
from .scenarios import SCENARIOS


@dataclass
class QuizDefinition:
    version: str
    core_items: list[QuizItem] = field(default_factory=list)
    scenarios: list[ScenarioDefinition] = field(default_factory=list)


def get_quiz_definition() -> QuizDefinition:
    return QuizDefinition(version=QUIZ_VERSION, core_items=list(CORE_ITEMS), scenarios=list(SCENARIOS))
