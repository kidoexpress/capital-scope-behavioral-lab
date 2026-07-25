"""Ten behavioral scenarios (concrete decisions, not statements).

Each option maps to a revealed risk_behavior in [0,1] and a twin action.
"""
from __future__ import annotations

from ..schemas.models import ScenarioDefinition, ScenarioOption


def _o(key, text, action, rb) -> ScenarioOption:
    return ScenarioOption(key=key, text=text, action=action, risk_behavior=rb)


SCENARIOS: list[ScenarioDefinition] = [
    ScenarioDefinition(
        "market_drop", "Queda de mercado",
        "Sua carteira caiu 12% em dois meses. Os objetivos de longo prazo nao mudaram.",
        [
            _o("A", "Vender grande parte para impedir novas perdas.", "SELL", 0.0),
            _o("B", "Reduzir uma parte do risco.", "PARTIAL_DE_RISK", 0.35),
            _o("C", "Nao alterar a carteira.", "HOLD", 0.6),
            _o("D", "Investir mais aproveitando os precos menores.", "BUY", 1.0),
            _o("E", "Procurar um assessor antes de decidir.", "REQUEST_REVIEW", 0.45),
        ], tags=["market_drop", "loss_aversion"]),
    ScenarioDefinition(
        "recent_rally", "Alta recente",
        "Um fundo subiu 28% em seis meses e esta sendo comentado por amigos e redes sociais.",
        [
            _o("A", "Comprar para nao ficar de fora.", "BUY", 1.0),
            _o("B", "Comprar uma pequena parte.", "PARTIAL_DE_RISK", 0.6),
            _o("C", "Ignorar o movimento.", "HOLD", 0.5),
            _o("D", "Pesquisar os fundamentos antes.", "REQUEST_REVIEW", 0.45),
        ], tags=["recent_rally", "herding"]),
    ScenarioDefinition(
        "liquidity_need", "Necessidade de liquidez",
        "Surge uma despesa inesperada equivalente a quatro meses de gastos.",
        [
            _o("A", "Vender investimentos rapidamente.", "SELL", 0.1),
            _o("B", "Usar a reserva de emergencia.", "HOLD", 0.7),
            _o("C", "Usar parte da reserva e parte de investimentos.", "PARTIAL_DE_RISK", 0.45),
            _o("D", "Buscar credito de baixo custo.", "REQUEST_REVIEW", 0.4),
        ], tags=["liquidity", "liquidity_anxiety"]),
    ScenarioDefinition(
        "underwater_asset", "Investimento no prejuizo",
        "Um ativo esta com perda de 25%, enquanto outro semelhante tem melhores fundamentos.",
        [
            _o("A", "Manter para nao realizar a perda.", "HOLD", 0.4),
            _o("B", "Trocar pelo ativo com melhores fundamentos.", "PARTIAL_DE_RISK", 0.7),
            _o("C", "Aumentar a posicao no ativo em queda.", "BUY", 0.85),
            _o("D", "Vender e ficar em caixa.", "SELL", 0.1),
        ], tags=["disposition_effect"]),
    ScenarioDefinition(
        "ai_recommendation", "Recomendacao de IA",
        "Um sistema de IA recomenda alterar 15% da carteira.",
        [
            _o("A", "Seguir sem revisar.", "PARTIAL_DE_RISK", 0.7),
            _o("B", "Seguir apos entender o motivo.", "PARTIAL_DE_RISK", 0.55),
            _o("C", "Ignorar a recomendacao.", "HOLD", 0.5),
            _o("D", "Validar com um assessor humano.", "REQUEST_REVIEW", 0.45),
        ], tags=["ai_trust"]),
    ScenarioDefinition(
        "human_recommendation", "Recomendacao humana",
        "Um assessor conhecido faz a mesma recomendacao de alterar 15% da carteira.",
        [
            _o("A", "Seguir sem revisar.", "PARTIAL_DE_RISK", 0.7),
            _o("B", "Seguir apos entender o motivo.", "PARTIAL_DE_RISK", 0.55),
            _o("C", "Ignorar a recomendacao.", "HOLD", 0.5),
            _o("D", "Pedir uma segunda opiniao.", "REQUEST_REVIEW", 0.45),
        ], tags=["advisor_trust"]),
    ScenarioDefinition(
        "higher_rates", "Juros mais altos",
        "A taxa de juros aumenta e a renda fixa passa a oferecer retorno esperado maior.",
        [
            _o("A", "Migrar grande parte para renda fixa.", "PARTIAL_DE_RISK", 0.3),
            _o("B", "Aumentar um pouco a renda fixa.", "PARTIAL_DE_RISK", 0.5),
            _o("C", "Manter a alocacao atual.", "HOLD", 0.6),
            _o("D", "Aproveitar para comprar acoes que cairam.", "BUY", 0.9),
        ], tags=["rate_shock"]),
    ScenarioDefinition(
        "windfall", "Ganho inesperado",
        "Voce recebe um valor equivalente a seis meses de renda.",
        [
            _o("A", "Investir tudo de forma agressiva.", "BUY", 1.0),
            _o("B", "Investir de forma diversificada.", "PARTIAL_DE_RISK", 0.65),
            _o("C", "Guardar em caixa por enquanto.", "HOLD", 0.4),
            _o("D", "Quitar dividas primeiro.", "REQUEST_REVIEW", 0.5),
        ], tags=["windfall"]),
    ScenarioDefinition(
        "bubble", "Bolha",
        "Um setor apresenta valorizacao rapida e maior dispersao entre preco e fundamentos.",
        [
            _o("A", "Entrar para aproveitar a alta.", "BUY", 1.0),
            _o("B", "Entrar com uma parte pequena.", "PARTIAL_DE_RISK", 0.6),
            _o("C", "Evitar o setor.", "HOLD", 0.5),
            _o("D", "Reduzir exposicao ao setor.", "SELL", 0.2),
        ], tags=["bubble", "herding"]),
    ScenarioDefinition(
        "long_underperformance", "Longo periodo sem resultado",
        "Uma estrategia fica abaixo do benchmark por 18 meses, mas segue dentro da tese inicial.",
        [
            _o("A", "Abandonar a estrategia.", "SELL", 0.1),
            _o("B", "Reduzir a exposicao.", "PARTIAL_DE_RISK", 0.4),
            _o("C", "Manter a estrategia.", "HOLD", 0.8),
            _o("D", "Reforcar a posicao.", "BUY", 1.0),
        ], tags=["strategy_commitment"]),
]

SCENARIOS_BY_ID = {s.scenario_id: s for s in SCENARIOS}
