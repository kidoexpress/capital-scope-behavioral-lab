"""Adaptive question selection (up to 12).

Triggers (computed by the scoring/flow layer, passed in as strings):
- "declared_vs_revealed"   declared risk vs scenario behavior conflict
- "straight_lining"        near-uniform core answers
- "tolerance_capacity_gap" declared tolerance exceeds financial capacity
- "source_dependence"      decisions change a lot by recommendation source
- "high_herding"           strong herding
- "low_consistency"        low response consistency
- "low_confidence:<dim>"   a dimension has too few/low-confidence items
"""
from __future__ import annotations

from ..schemas.models import QuizItem

MAX_ADAPTIVE = 12

# One reinforcing item per behavioral dimension (used by low_confidence:<dim>).
_DIM_ITEMS: dict[str, QuizItem] = {
    "loss_aversion": QuizItem("ADP_loss2", "B", "loss_aversion",
        "Depois de uma perda, penso nela por varios dias."),
    "overconfidence": QuizItem("ADP_over2", "B", "overconfidence",
        "Minhas decisoes de investimento costumam sair melhor do que a media."),
    "herding": QuizItem("ADP_herd2", "B", "herding",
        "Sinto seguranca em investir no que a maioria esta investindo."),
    "liquidity_anxiety": QuizItem("ADP_liq2", "B", "liquidity_anxiety",
        "Preciso saber que posso resgatar meu dinheiro a qualquer momento."),
    "ai_trust": QuizItem("ADP_ai2", "B", "ai_trust",
        "Seguiria uma alocacao sugerida por um sistema automatizado."),
    "advisor_trust": QuizItem("ADP_adv2", "B", "advisor_trust",
        "Prefiro decidir apos ouvir um profissional."),
    "strategy_commitment": QuizItem("ADP_commit2", "D", "strategy_commitment",
        "Raramente mudo de estrategia por causa de um resultado de curto prazo."),
    "reaction_to_losses": QuizItem("ADP_react2", "D", "reaction_to_losses",
        "Quedas fortes me fazem querer agir imediatamente."),
}

# Special clarifying items tied to conflict triggers.
_TRIGGER_ITEMS: dict[str, QuizItem] = {
    "declared_vs_revealed": QuizItem("ADP_conflict1", "D", "strategy_commitment",
        "Voce manteria a carteira se soubesse que quedas semelhantes ja ocorreram "
        "varias vezes e a recuperacao poderia levar mais de dois anos?"),
    "tolerance_capacity_gap": QuizItem("ADP_capacity1", "B", "liquidity_anxiety",
        "Uma perda que atrasasse seus objetivos principais seria aceitavel para voce?",
        reverse_scored=True),
    "source_dependence": QuizItem("ADP_source1", "D", "source_dependence",
        "Minha decisao muda bastante dependendo de quem faz a recomendacao."),
    "high_herding": QuizItem("ADP_herd3", "B", "herding",
        "Evito investimentos populares justamente por serem populares.", reverse_scored=True),
    "straight_lining": QuizItem("ADP_attn1", "A", "conscientiousness",
        "Reviso minhas decisoes financeiras antes de confirma-las."),
    "low_consistency": QuizItem("ADP_cons1", "D", "strategy_commitment",
        "Costumo agir de forma coerente com o que planejei."),
}


def select_adaptive(triggers: list[str], max_adaptive: int = MAX_ADAPTIVE) -> list[QuizItem]:
    """Map active triggers to a de-duplicated, capped list of adaptive items."""
    picked: dict[str, QuizItem] = {}
    for t in triggers:
        if t.startswith("low_confidence:"):
            dim = t.split(":", 1)[1]
            item = _DIM_ITEMS.get(dim)
            if item:
                picked[item.question_id] = item
        elif t in _TRIGGER_ITEMS:
            item = _TRIGGER_ITEMS[t]
            picked[item.question_id] = item
        if len(picked) >= max_adaptive:
            break
    return list(picked.values())[:max_adaptive]
