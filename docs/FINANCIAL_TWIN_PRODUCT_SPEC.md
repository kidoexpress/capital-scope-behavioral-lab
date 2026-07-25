# Capital Scope Financial Twin — Product Spec

> **Capital Scope Financial Twin** · *Entenda seu comportamento financeiro e teste
> uma carteira criada para a forma como você realmente toma decisões.*

Módulo técnico: **financial-twin-lab** · Rota: **/financial-twin**

Uma experiência baseada em **quiz** que cria um **gêmeo financeiro sintético** do
usuário, observa como ele **provavelmente** reagiria a situações de mercado, e um
**motor quantitativo** monta uma carteira coerente com o comportamento observado.

## 1. Fluxo do produto

1. O usuário responde a um quiz comportamental e financeiro.
2. As respostas viram um **perfil multidimensional**.
3. O sistema cria um **gêmeo financeiro sintético**.
4. O gêmeo é colocado em situações de mercado.
5. O sistema observa a **reação provável**.
6. O motor quantitativo monta uma carteira coerente com objetivos, situação
   financeira, tolerância a risco, comportamento observado, liquidez, horizonte e
   restrições.
7. Simula como a carteira **pode** se comportar em 3, 6 e 12 meses.
8. O usuário recebe: carteira sugerida, distribuição de possíveis retornos,
   probabilidade de perda, intervalo provável, riscos, reações prováveis do gêmeo,
   e explicação auditável.

## 2. Posicionamento e linguagem (obrigatório)

**Usar:** gêmeo financeiro sintético, representação comportamental, perfil estimado,
resposta provável, cenário simulado, retorno esperado, intervalo de resultados,
previsão probabilística.

**Nunca usar:** cópia perfeita, previsão garantida, retorno garantido, comportamento
certo, carteira sem risco, recomendação infalível.

Sempre deixar claro: resultados passados não garantem resultados futuros; previsões
são probabilísticas; o gêmeo pode não representar todas as decisões reais; o produto
é educacional/experimental; a carteira não é aconselhamento financeiro definitivo.

## 3. Pergunta central

Dado o comportamento financeiro de uma pessoa, seus objetivos e sua situação, qual
carteira tem maior coerência entre: o risco que ela **pode** assumir, o que **diz**
aceitar, o que **realmente** aceita em situações concretas, sua liquidez, seus
objetivos, e sua tendência de manter ou abandonar a estratégia em períodos difíceis?

## 4. Outcome principal

1. Um **Financial Twin Profile**.
2. Uma carteira recomendada pelo **motor quantitativo**.
3. Comparação com carteiras de referência.
4. Previsão probabilística para 3, 6 e 12 meses.
5. Simulação das reações do gêmeo em eventos específicos.
6. Explicação **auditável** de como o quiz afetou a carteira.
7. Relatório de limitações e pontos de atenção.

## 5. Princípio mais importante — separação LLM / motor quantitativo

A **LLM não pode calcular nem decidir os pesos finais** da carteira.

A LLM **pode**: interpretar respostas abertas, resumir, selecionar perguntas
adaptativas, gerar explicações, simular reações da persona, criar reflexões a partir
de eventos registrados.

O **motor quantitativo deve**: calcular retornos, estimar risco e covariâncias,
aplicar restrições, otimizar pesos, rodar Monte Carlo/bootstrap, calcular métricas,
validar resultados e **produzir os pesos finais**.

No MVP **não há chamadas de LLM** — tudo é determinístico e baseado em regras.

## 6. Base de pesquisa

- `docs/references/2304.03442v2.pdf` (Generative Agents): memória de experiências,
  recuperação por relevância/recência/importância, reflexão, atualização de crenças,
  planejamento, reação a novos eventos. **Não** copiar o ambiente de cidade virtual;
  adaptar os princípios ao contexto financeiro individual.
- `docs/references/2505.07457v1.pdf` (agentes em mercados): memória de decisões,
  comportamento de tendência/fundamentalista/contrarian, adaptação, heterogeneidade
  entre agentes, comparação em diferentes condições de mercado.

## 7. Sete etapas da experiência (8 telas)

Consent → Financial Context → Personality & Behavior Quiz → Scenario Decisions →
Financial Twin Profile → Portfolio Construction → Future Simulation & Results
(+ "How your twin would react" screen).

## 8. Privacidade (resumo — ver IMPLEMENTATION_PLAN §Privacy)

Consentimento versionado; opção de não salvar; apagar gêmeo/respostas; exportar
dados; dados sensíveis (raça, religião, orientação sexual, saúde, política) **não**
são solicitados obrigatoriamente e **não** afetam a carteira; logs sem respostas
sensíveis; não enviar respostas completas a serviços externos sem consentimento.

## 9. Métrica central — Behavioral Portfolio Fit (configurável, não definitiva)

```
behavioral_portfolio_fit =
    0.20 * objective_alignment
  + 0.20 * risk_capacity_alignment
  + 0.15 * revealed_behavior_alignment
  + 0.15 * liquidity_alignment
  + 0.10 * scenario_survival
  + 0.10 * strategy_maintenance_probability
  + 0.10 * diversification_quality
  - violation_penalties
```

## 10. Critérios de aceitação do MVP

Ver IMPLEMENTATION_PLAN §Acceptance (18 critérios), incluindo: quiz < 10 min, perfil
multidimensional, separação risco declarado/demonstrado/capacidade, gêmeo reage a
≥10 cenários com **probabilidades**, carteira por classes respeitando restrições,
≥4 métodos comparados, previsão 3/6/12m com percentis e chance de perda, stress
tests, backtest **sem vazamento temporal**, exclusão/exportação, testes passando, e
**Capital Scope 2 original inalterado**.
