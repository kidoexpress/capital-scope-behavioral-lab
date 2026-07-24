"""Persona decision agents.

Phase 1 ships only the RuleBasedPersonaAgent. LLM / Hybrid / HumanReplay agents
implement the same PersonaAgent interface in later phases.

The rule engine maps a scenario's shocks + the persona's traits, dynamic state
and retrieved memories into a structured BehavioralDecision. Different personas
must produce different decisions for the same scenario (behavioral separation).

Decisions are PROPOSALS. Allocation deltas are expressed at the asset-class level
(keys: "equity", "fixed_income", "commodity", "cash") and net to ~0; the
Portfolio Construction Engine turns them into validated final weights.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from ..schemas.models import BehavioralDecision, Memory, Persona, Scenario

# Action thresholds on the risk tilt (documented, tunable).
T_MILD = 0.03
T_STRONG = 0.10


class PersonaAgent(ABC):
    @abstractmethod
    def decide(
        self,
        persona: Persona,
        market_state: dict,
        scenario: Scenario,
        portfolio: dict[str, float] | None,
        memories: list[Memory],
        intervention: dict | None,
    ) -> BehavioralDecision:
        ...


class RuleBasedPersonaAgent(PersonaAgent):
    """Deterministic, trait-driven decision policy (no randomness, no LLM)."""

    def _memory_bias(self, memories: list[Memory]) -> float:
        """Net emotional lesson from outcome/decision memories.

        Positive bias (e.g. "holding through a crash was rewarded") reduces the
        defensive tilt; supports H1 (memory changes decisions)."""
        if not memories:
            return 0.0
        total = 0.0
        for m in memories:
            if m.type in ("outcome", "decision"):
                total += m.emotional_valence * m.reliability * (m.importance / 10.0)
        return total / len(memories)

    def _risk_tilt(self, persona: Persona, scenario: Scenario, memory_bias: float) -> float:
        t = persona.behavioral_traits
        s = persona.dynamic_state
        eq = scenario.shocks.equity_return
        vol = scenario.shocks.volatility_change
        downside = max(0.0, -eq)

        # Trend component: trend_sensitivity>0 follows the move, <0 opposes it.
        trend = t.trend_sensitivity * eq * 1.2
        # Loss aversion pulls toward de-risking on downside, dampened by overconfidence.
        loss = -t.loss_aversion * downside * (1.0 - 0.5 * t.overconfidence)
        # Ambiguity/volatility aversion.
        volterm = -t.ambiguity_aversion * max(0.0, vol) * 0.15
        # Risk tolerance baseline bias and conviction (overconfidence * risk_tolerance).
        base = (t.risk_tolerance - 0.5) * 0.06 + t.overconfidence * t.risk_tolerance * downside * 0.4
        # Dynamic state: recent loss and stress add defensiveness.
        state = -s.recent_loss * 0.5 - (s.stress - 0.2) * 0.05
        # Memory nudge (H1).
        mem = memory_bias * 0.10
        return trend + loss + volterm + base + state + mem

    def _apply_intervention(
        self, persona: Persona, tilt: float, intervention: dict | None
    ) -> tuple[float, bool, list[str]]:
        """Adjust tilt/flags from a received recommendation (experiment 4).

        intervention example: {"source": "advisor"|"ai"|"advisor_validated_ai",
        "suggested": "REDUCE_RISK"|"HOLD"|..., "strength": 0.5}"""
        if not intervention:
            return tilt, False, []
        t = persona.behavioral_traits
        source = intervention.get("source", "")
        strength = float(intervention.get("strength", 0.5))
        suggested = intervention.get("suggested", "")
        trust = {
            "advisor": t.advisor_trust,
            "ai": t.ai_trust,
            "advisor_validated_ai": min(1.0, 0.5 * (t.advisor_trust + t.ai_trust) + 0.2),
        }.get(source, 0.0)
        direction = 0.0
        if suggested in ("REDUCE_RISK", "MOVE_TO_CASH", "SELL"):
            direction = -1.0
        elif suggested in ("INCREASE_RISK", "BUY"):
            direction = 1.0
        codes: list[str] = []
        if trust > 0:
            codes.append(f"recommendation_{source}")
        request_review = source in ("ai",) and t.advisor_trust > 0.6 and trust < 0.6
        return tilt + direction * trust * strength * 0.08, request_review, codes

    def decide(
        self,
        persona: Persona,
        market_state: dict,
        scenario: Scenario,
        portfolio: dict[str, float] | None,
        memories: list[Memory],
        intervention: dict | None = None,
    ) -> BehavioralDecision:
        t = persona.behavioral_traits
        mem_bias = self._memory_bias(memories)
        tilt = self._risk_tilt(persona, scenario, mem_bias)
        tilt, iv_review, iv_codes = self._apply_intervention(persona, tilt, intervention)

        eq = scenario.shocks.equity_return
        downside = max(0.0, -eq)
        reason_codes: list[str] = list(iv_codes)

        # ── choose action ──
        if tilt >= T_STRONG:
            action = "INCREASE_RISK"
        elif tilt >= T_MILD:
            action = "BUY"
        elif tilt <= -T_STRONG:
            action = "MOVE_TO_CASH"
        elif tilt <= -T_MILD:
            action = "REDUCE_RISK"
        else:
            action = "HOLD"

        # ── magnitude of the equity<->cash shift ──
        magnitude = min(0.30, abs(tilt) * 1.5)
        alloc: dict[str, float] = {}
        target_assets: list[str] = []
        if action in ("REDUCE_RISK", "MOVE_TO_CASH", "SELL"):
            alloc = {"equity": -magnitude, "cash": magnitude}
            target_assets = ["equity", "cash"]
        elif action in ("INCREASE_RISK", "BUY"):
            alloc = {"cash": -magnitude, "equity": magnitude}
            target_assets = ["equity", "cash"]

        # ── reason codes ──
        if t.trend_sensitivity >= 0.5 and eq > 0:
            reason_codes.append("trend_following")
        if t.trend_sensitivity < 0 and eq < 0:
            reason_codes.append("contrarian_reversion")
        if t.loss_aversion >= 0.7 and downside > 0:
            reason_codes.append("high_loss_aversion")
        if scenario.shocks.volatility_change > 0.2:
            reason_codes.append("volatility_aversion")
        if downside >= 0.12 and persona.constraints.maximum_expected_drawdown <= 0.15:
            reason_codes.append("drawdown_limit_risk")
        if t.overconfidence >= 0.7 and action == "HOLD":
            reason_codes.append("conviction_hold")
        if abs(mem_bias) > 0.05:
            reason_codes.append("memory_informed")
        if not reason_codes:
            reason_codes.append("within_risk_limit")

        # ── request human review ──
        request_review = bool(iv_review)
        if t.advisor_trust >= 0.6 and downside >= 0.15 and t.loss_aversion >= 0.6:
            request_review = True
            reason_codes.append("liquidity_preference")

        # ── confidence & behavioral effect ──
        confidence = max(0.05, min(0.95,
            persona.dynamic_state.confidence
            + 0.2 * (t.overconfidence - 0.5)
            - 0.3 * scenario.severity * (1.0 - t.overconfidence)))
        stress_change = round(0.15 * downside - 0.05 * max(0.0, eq), 4)
        confidence_change = round(-0.10 * downside + 0.05 * max(0.0, eq), 4)

        return BehavioralDecision(
            persona_id=persona.persona_id,
            scenario_id=scenario.scenario_id,
            action=action,
            target_assets=target_assets,
            allocation_changes={k: round(v, 4) for k, v in alloc.items()},
            confidence=round(confidence, 4),
            request_human_review=request_review,
            reason_codes=reason_codes,
            memories_used=[m.memory_id for m in memories],
            expected_behavioral_effect={
                "stress_change": stress_change,
                "confidence_change": confidence_change,
            },
        )
