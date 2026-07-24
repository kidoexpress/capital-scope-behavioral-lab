# Capital Scope Synthetic Portfolio Lab — Product Spec

> Laboratório interativo de construção de portfólio **orientado por cenários e
> comportamento**. O sistema **não** afirma prever o futuro com certeza — trabalha
> com cenários, probabilidades, intervalos, distribuições, hipóteses, resultados
> simulados, risco estimado e possíveis estados futuros.

Nome do módulo: **Synthetic Portfolio Lab** ·
Nome na interface: **Capital Scope Synthetic Portfolio Lab**

## 1. Três capacidades conectadas

1. Gerar **cenários probabilísticos** de possíveis estados futuros do mercado.
2. Simular como **personas sintéticas** de investidores reagiriam a esses cenários.
3. Montar e comparar **portfólios** com base no comportamento, objetivos, restrições
   e nível de risco de cada persona.

## 2. Entradas do usuário

Perfil do investidor, objetivos, horizonte, tolerância a risco, restrições, ativos
disponíveis, cenário econômico inicial e exemplos de situações futuras a testar.

## 3. O que o sistema faz

1. gera possíveis cenários futuros; 2. atribui probabilidades; 3. executa cada
persona nos cenários; 4. registra decisões e mudanças comportamentais; 5. cria
portfólios candidatos; 6. testa os portfólios nos cenários; 7. compara retorno,
risco, drawdown, liquidez e aderência ao perfil; 8. explica por que cada portfólio
foi formado; 9. mostra quais situações podem fazer a persona mudar de decisão.

## 4. Use case principal

Entender como diferentes investidores podem reagir a eventos como: queda de 15%,
alta/queda de juros, inflação acima do esperado, valorização de tech, queda de
commodities, alta do dólar, recessão, aumento de volatilidade, notícia negativa,
perda/ganho recentes, necessidade de liquidez, recomendação de assessor/IA,
comportamento de manada, mudança de horizonte.

## 5. Outcome principal (MVP)

Gerar um portfólio por persona que: (1) respeite as restrições declaradas;
(2) mantenha coerência com o comportamento simulado; (3) permaneça dentro dos
limites de risco; (4) seja comparável a baselines simples; (5) seja testado em
múltiplos cenários; (6) tenha justificativa auditável.

## 6. Métrica central — Behavioral Portfolio Fit Score

Versão inicial (pesos **configuráveis**, não definitivos):

```
behavioral_portfolio_fit =
      0.25 * persona_adherence
    + 0.20 * risk_constraint_adherence
    + 0.15 * liquidity_adherence
    + 0.15 * behavioral_consistency
    + 0.15 * scenario_stability
    + 0.10 * objective_alignment
    - violation_penalties
```

Componentes: aderência ao perfil, aderência às decisões simuladas, respeito aos
limites de risco, necessidade de liquidez, consistência temporal, estabilidade
entre cenários, penalidade por violações, penalidade por concentração excessiva.

## 7. Regra de segurança (arquitetura)

A LLM (Fase 3, **não** nesta fase) pode interpretar cenário, propor ação, indicar
confiança, escolher reason codes, resumir memórias e produzir reflexões. A LLM
**não** pode alterar preços, inventar saldo, executar ordens, modificar patrimônio,
ignorar limites, calcular métricas finais sem validação, decidir pesos finais sem o
motor quantitativo, alterar regras, apagar eventos ou sobrescrever resultados.
**O motor determinístico valida todas as decisões.**

## 8. Linguagem

Sempre: cenário, probabilidade, intervalo, distribuição, hipótese, resultado
simulado, risco estimado, possível estado futuro. **Nunca** apresentar resultados
como garantia de retorno ou recomendação financeira definitiva.

## 9. Fluxo da interface (Fase 2)

Rota `/synthetic-portfolio-lab`, cinco etapas: Persona Setup → Scenario Setup →
Behavioral Simulation → Portfolio Construction → Results and Comparison.
**A UI não é implementada na Fase 1.**
