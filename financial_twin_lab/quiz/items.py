"""Versioned core quiz item bank (32 items). Original items, PT-BR.

Big Five (Module A) uses 4 items per dimension (20). Modules B/C/D cover the
highest-signal behavioral dimensions with 1 core item each (12); adaptive questions
fill low-confidence dimensions. Reverse-scored items reduce straight-lining.
Do NOT copy protected commercial-test items.
"""
from __future__ import annotations

from ..schemas.models import QuizItem


def _i(qid, module, dim, text, reverse=False) -> QuizItem:
    return QuizItem(question_id=qid, module=module, dimension=dim, text=text, reverse_scored=reverse)


CORE_ITEMS: list[QuizItem] = [
    # ── Module A: Big Five (4 items each) ──
    _i("A_o1", "A", "openness", "Gosto de avaliar novas possibilidades, mesmo quando ja tenho uma opcao conhecida."),
    _i("A_o2", "A", "openness", "Tenho curiosidade por formas diferentes de investir."),
    _i("A_o3", "A", "openness", "Prefiro decisoes previsiveis a opcoes com resultados muito diferentes entre si.", reverse=True),
    _i("A_o4", "A", "openness", "Gosto de aprender sobre assuntos financeiros que ainda nao conheco."),
    _i("A_c1", "A", "conscientiousness", "Costumo seguir planos financeiros que defini anteriormente."),
    _i("A_c2", "A", "conscientiousness", "Organizo meus gastos e investimentos com cuidado."),
    _i("A_c3", "A", "conscientiousness", "Frequentemente adio tarefas financeiras importantes.", reverse=True),
    _i("A_c4", "A", "conscientiousness", "Cumpro as metas de poupanca que estabeleco."),
    _i("A_e1", "A", "extraversion", "Sinto necessidade de conversar com outras pessoas antes de decisoes importantes."),
    _i("A_e2", "A", "extraversion", "Gosto de discutir investimentos com outras pessoas."),
    _i("A_e3", "A", "extraversion", "Prefiro decidir sobre dinheiro sozinho, sem comentar com ninguem.", reverse=True),
    _i("A_e4", "A", "extraversion", "Fico animado ao participar de conversas sobre mercado."),
    _i("A_a1", "A", "agreeableness", "Costumo confiar nas recomendacoes de pessoas proximas."),
    _i("A_a2", "A", "agreeableness", "Evito conflitos quando discordo de conselhos financeiros."),
    _i("A_a3", "A", "agreeableness", "Questiono bastante as recomendacoes que recebo.", reverse=True),
    _i("A_a4", "A", "agreeableness", "Tento considerar o ponto de vista dos outros em decisoes financeiras."),
    _i("A_es1", "A", "emotional_stability", "Uma queda inesperada tende a ocupar meus pensamentos por bastante tempo.", reverse=True),
    _i("A_es2", "A", "emotional_stability", "Mantenho a calma quando meus investimentos oscilam."),
    _i("A_es3", "A", "emotional_stability", "Fico ansioso com facilidade quando o mercado cai.", reverse=True),
    _i("A_es4", "A", "emotional_stability", "Consigo ficar tranquilo mesmo em periodos de volatilidade."),

    # ── Module B: financial behavior (1 core item each) ──
    _i("B_loss", "B", "loss_aversion", "Uma perda de R$ 1.000 me incomoda mais do que um ganho de R$ 1.000 me satisfaz."),
    _i("B_over", "B", "overconfidence", "Costumo acreditar que consigo identificar boas oportunidades antes da maioria."),
    _i("B_herd", "B", "herding", "Fico mais confortavel comprando um investimento quando muitas pessoas estao comprando."),
    _i("B_selfctrl", "B", "financial_self_control", "Consigo manter aportes mesmo quando aparecem oportunidades de consumo imediato."),
    _i("B_savings", "B", "savings_discipline", "Guardo uma parte da minha renda todos os meses."),
    _i("B_liqanx", "B", "liquidity_anxiety", "Fico desconfortavel quando pouco do meu dinheiro esta disponivel rapidamente."),
    _i("B_advisor", "B", "advisor_trust", "Confio em recomendacoes de um assessor humano de confianca."),
    _i("B_ai", "B", "ai_trust", "Confio em recomendacoes geradas por sistemas de inteligencia artificial."),

    # ── Module C: consumption (2 core items) ──
    _i("C_future", "C", "future_orientation", "Prefiro manter uma reserva disponivel mesmo que isso reduza meu retorno esperado."),
    _i("C_impulse", "C", "impulsive_spending", "Compro algumas coisas porque estao em promocao, mesmo sem ter planejado."),

    # ── Module D: investing habits (2 core items) ──
    _i("D_commit", "D", "strategy_commitment", "Mantenho minha estrategia de investimento mesmo em periodos ruins."),
    _i("D_react_loss", "D", "reaction_to_losses", "Tenho dificuldade para manter dinheiro investido quando vejo uma queda forte."),
]

CORE_ITEMS_BY_ID = {it.question_id: it for it in CORE_ITEMS}

assert len(CORE_ITEMS) == 32, f"expected 32 core items, got {len(CORE_ITEMS)}"
