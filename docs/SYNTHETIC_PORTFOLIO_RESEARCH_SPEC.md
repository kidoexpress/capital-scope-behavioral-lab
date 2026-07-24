# Synthetic Portfolio Lab — Research Spec

## 1. Pergunta de pesquisa

Como personas sintéticas com memória e traços comportamentais distintos podem ser
usadas para construir portfólios que permaneçam coerentes com seus objetivos e
limites em diferentes cenários de mercado?

## 2. Hipóteses

- **H1** — Personas com memória de decisões e resultados produzem portfólios mais
  consistentes do que personas definidas apenas por um prompt estático.
- **H2** — Personas diferentes devem gerar alocações diferentes para o mesmo cenário.
- **H3** — Choques negativos reduzem a diferença entre personas (várias migram
  simultaneamente para comportamentos defensivos).
- **H4** — Portfólios que combinam comportamento simulado com restrições
  quantitativas são mais coerentes do que os gerados só por texto de LLM.
- **H5** — Sistemas híbridos (LLM propõe, motor quantitativo valida) apresentam
  menos violações de risco.

## 3. Arquitetura em cinco motores

```
market data
  -> [1] Scenario Engine        (gera possíveis estados futuros + probabilidades)
  -> [2] Synthetic Persona Engine (traços estáveis + estado dinâmico + memória)
  -> [3] Behavioral Decision Engine (persona observa e PROPÕE decisão estruturada)
  -> [4] Portfolio Construction Engine (motor quantitativo calcula pesos finais)
  -> [5] Evaluation & Explanation Engine (métricas + explicação auditável)
```

## 4. Forecasting — distribuições, não pontos

Cada previsão retorna média/mediana, volatilidade, downside_probability, quantis
(p05..p95), confiança, método, premissas e versão do modelo. Métodos da Fase 1:

1. Historical Mean Baseline
2. Rolling Mean Baseline
3. Historical Bootstrap
4. Monte Carlo (parâmetros configuráveis)
5. Regime-Based Forecast (bull/bear/sideways/high_vol/low_vol/risk_on/risk_off)

Sem deep learning nesta fase. HMM/clustering/supervisionado ficam atrás de uma
interface (`RegimeClassifier`) para substituição futura.

### Avaliação da previsão

MAE, RMSE, directional_accuracy, Brier score, calibration_error,
interval_coverage, quantile_loss, forecast_bias. **Separação temporal treino/teste;
nenhum dado posterior ao período simulado entra na previsão (sem vazamento).**

## 5. Avaliação das personas

persona_adherence_score, decision_consistency, behavioral_separation,
strategy_switch_rate, memory_influence_score, scenario_sensitivity,
risk_violation_rate, action_entropy, persona_classification_accuracy.

**Behavioral separation:** decisões como vetores → distância entre personas →
classificador simples identifica a persona pela sequência de decisões → comparação
com referência aleatória.

## 6. Avaliação dos portfólios

cumulative_return, annualized_return, volatility, Sharpe, Sortino, max_drawdown,
VaR, CVaR, turnover, transaction_cost, concentration, liquidity_score,
scenario_survival_rate, objective_alignment, behavioral_portfolio_fit.

Baselines: equal weight, portfólio atual da persona, risk-based, conservative
benchmark, static persona portfolio, sem memória, com memória.

## 7. Experimentos previstos

1. Efeito de queda de 15% (Conservative × Trend-Follower × Contrarian).
2. Aumento de juros (antes × depois × otimização pura × comportamental).
3. Memória (sem × 1 decisão × 3 decisões × resumo completo).
4. Fonte da recomendação (sem × assessor × IA × IA validada por assessor).

## 8. Reprodutibilidade

Toda execução registra seed, versão do código, versão do modelo, parâmetros,
universo de ativos, período dos dados, cenários, personas, configurações e
resultados. A mesma configuração deve reproduzir exatamente o mesmo resultado.

## 9. Base científica

Herda o paper `docs/references/2505.07457v1.pdf` (agentes generativos em
experimentos de mercado). O contrato "agente propõe / motor determinístico valida e
executa" é o mesmo do Behavioral Lab.
