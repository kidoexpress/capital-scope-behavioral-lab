"""Persona memory store and configurable retrieval.

Five memory types are supported (episodic, semantic, decision, outcome,
relational). Retrieval combines relevance, recency, importance, emotional
intensity, objective relation and reliability using the persona's MemoryConfig
weights (configurable interface).
"""
from __future__ import annotations

from ..schemas.models import Memory, MemoryConfig, Persona, Scenario


class MemoryStore:
    def __init__(self, memories: list[Memory] | None = None) -> None:
        self._memories: list[Memory] = list(memories or [])

    def add(self, memory: Memory) -> None:
        self._memories.append(memory)

    def for_persona(self, persona_id: str) -> list[Memory]:
        return [m for m in self._memories if m.persona_id == persona_id]

    def all(self) -> list[Memory]:
        return list(self._memories)

    # ── scoring ──
    @staticmethod
    def _relevance(memory: Memory, scenario: Scenario) -> float:
        score = 0.0
        if scenario.scenario_id in memory.related_scenarios:
            score += 0.6
        # regime keyword match against related scenarios (e.g. "bear_market")
        if any(scenario.market_regime in rs for rs in memory.related_scenarios):
            score += 0.4
        return min(score, 1.0)

    @staticmethod
    def _objective_relation(memory: Memory, persona: Persona) -> float:
        # Outcome/decision memories are treated as more objective-relevant.
        if memory.type in ("outcome", "decision"):
            return 0.8
        if memory.type == "relational":
            return 0.4
        return 0.5

    def score(
        self,
        memory: Memory,
        persona: Persona,
        scenario: Scenario,
        recency: float,
        cfg: MemoryConfig,
    ) -> float:
        relevance = self._relevance(memory, scenario)
        importance = memory.importance / 10.0
        emotion = abs(memory.emotional_valence)
        objective = self._objective_relation(memory, persona)
        reliability = memory.reliability
        return (
            cfg.relevance_weight * relevance
            + cfg.recency_weight * recency
            + cfg.importance_weight * importance
            + cfg.emotion_weight * emotion
            + cfg.objective_weight * objective
            + cfg.reliability_weight * reliability
        )

    def retrieve(self, persona: Persona, scenario: Scenario) -> list[Memory]:
        """Return the top-N memories for this persona under its MemoryConfig.

        Recency is derived from insertion order (later == more recent)."""
        cfg = persona.memory_config
        if not cfg.enabled:
            return []
        pool = self.for_persona(persona.persona_id)
        if not pool:
            return []
        n = len(pool)
        scored: list[tuple[float, Memory]] = []
        for idx, mem in enumerate(pool):
            recency = (idx + 1) / n  # 0..1, most recent highest
            scored.append((self.score(mem, persona, scenario, recency, cfg), mem))
        scored.sort(key=lambda t: t[0], reverse=True)
        return [m for _, m in scored[: max(cfg.memory_length, 0)]]


def seed_memories(persona: Persona) -> list[Memory]:
    """Deterministic starter memories per persona (no randomness).

    Encodes a small prior of experiences that bias behavior, e.g. a conservative
    investor remembers that selling into a crash was followed by a recovery.
    """
    pid = persona.persona_id
    memories: list[Memory] = []

    if "conservative" in pid or "income" in pid:
        memories.append(Memory(
            memory_id=f"{pid}_mem_outcome_1", persona_id=pid, type="outcome",
            content="A venda durante a queda anterior foi seguida por recuperacao do mercado.",
            importance=8.0, emotional_valence=-0.5, reliability=0.9,
            related_assets=["ETF_SPY"], related_scenarios=["bear_market", "scenario_bear"],
            supporting_event_ids=["event_101"]))
        memories.append(Memory(
            memory_id=f"{pid}_mem_decision_1", persona_id=pid, type="decision",
            content="Manteve caixa elevado em periodos de estresse e reduziu drawdown.",
            importance=7.0, emotional_valence=0.2, reliability=0.85,
            related_scenarios=["liquidity_crisis", "risk_off"]))

    if "trend" in pid or "concentrated" in pid:
        memories.append(Memory(
            memory_id=f"{pid}_mem_outcome_1", persona_id=pid, type="outcome",
            content="Aumentar exposicao em tendencia de alta gerou ganhos acima do esperado.",
            importance=7.5, emotional_valence=0.7, reliability=0.7,
            related_assets=["ETF_QQQ", "EQ_TSLA"], related_scenarios=["bull", "technology_bubble"]))

    if "contrarian" in pid:
        memories.append(Memory(
            memory_id=f"{pid}_mem_outcome_1", persona_id=pid, type="outcome",
            content="Comprar apos quedas fortes foi recompensado na reversao.",
            importance=7.0, emotional_valence=0.4, reliability=0.75,
            related_scenarios=["bear", "recession"]))

    if "fundamentalist" in pid:
        memories.append(Memory(
            memory_id=f"{pid}_mem_semantic_1", persona_id=pid, type="semantic",
            content="Precos tendem a convergir para o valor fundamental no longo prazo.",
            importance=6.5, emotional_valence=0.0, reliability=0.8,
            related_scenarios=["sideways", "base_case"]))

    # A shared relational memory: trust built with a human advisor.
    memories.append(Memory(
        memory_id=f"{pid}_mem_relational_1", persona_id=pid, type="relational",
        content="Recomendacoes revisadas por um assessor humano aumentaram a confianca.",
        importance=5.0, emotional_valence=0.3,
        reliability=persona.behavioral_traits.advisor_trust,
        related_scenarios=[]))
    return memories
