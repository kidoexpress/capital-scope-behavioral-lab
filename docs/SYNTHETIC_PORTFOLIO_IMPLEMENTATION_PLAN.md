# Synthetic Portfolio Lab — Implementation Plan

## 1. Decisão de stack

Fase 1 é **numérica + CLI + testes**, sem UI. Implementada como **pacote Python**
`synthetic_portfolio_lab/` (irmão de `paper_trading/`), reaproveitando
numpy/scipy/pandas/pytest e os padrões de `paper_trading/metrics.py` e
`paper_trading/repository.py`. A UI React (`src/synthetic-portfolio-lab/`, rota
`/synthetic-portfolio-lab`) é **Fase 2** e não é tocada agora.

Nada do Capital Scope existente é modificado; o módulo é isolado.

## 2. Estrutura do pacote

```
synthetic_portfolio_lab/
  schemas/        dataclasses + enums + validação de schema
  assets/         universo controlado (10–30 ativos) + geração de séries semeadas
  personas/       6 templates + carga
  memory/         tipos de memória + recuperação configurável
  scenarios/      10 templates + engine (user/historical/rule/montecarlo) + normalização de probabilidade
  forecasting/    mean, rolling mean, bootstrap, monte carlo, regime-based + interface RegimeClassifier
  behavior/       PersonaAgent (interface) + RuleBasedPersonaAgent + validação de decisão
  portfolios/     equal_weight, risk_based, persona_rule_based, behavioral_scenario
  optimization/   aplicação de restrições, normalização, controle de concentração
  evaluation/     métricas de portfólio, de previsão, de persona + behavioral_portfolio_fit
  explanations/   explicação auditável baseada em IDs
  experiments/    runner de experimentos + reprodutibilidade
  repositories/   persistência JSON mínima
  cli.py          execução por linha de comando + exportação JSON
  tests/          pytest
```

Separação estrita domínio × interface. Nenhum cálculo financeiro no frontend.

## 3. Regra de segurança implementada

Agentes (Fase 1: baseados em regras) **propõem** `BehavioralDecision`. O motor
determinístico **valida** (pesos, limites, soma, ativos, risco, liquidez,
concentração, schema) e só então **executa**. Sem LLM, sem rede, sem ordens reais.

## 4. Reprodutibilidade

RNG semeado (`numpy.random.default_rng(seed)`). Séries de ativos, cenários de Monte
Carlo, bootstrap e execuções de experimento são todos deriváveis da semente. Mesma
config ⇒ mesmo resultado (coberto por teste).

## 5. Escopo da Fase 1 (implementar agora)

1. Schemas centrais · 2. 6 personas · 3. 10 cenários · 4. universo de ativos ·
5. agentes por regras · 6. Historical Mean · 7. Historical Bootstrap ·
8. Monte Carlo simples · 9. Equal Weight · 10. Persona Rule-Based Portfolio (+
Behavioral Scenario Portfolio) · 11. métricas básicas · 12. CLI · 13. persistência
mínima (JSON) · 14. testes unitários · 15. exportação JSON.

**Não** na Fase 1: LLM, UI, dados em tempo real, ordens reais.

## 6. Fases seguintes (NÃO executar agora)

- **Fase 2:** interface, gráficos, criação interativa, comparação de cenários,
  replay visual, exportação CSV, histórico de experimentos.
- **Fase 3:** LLMPersonaAgent, memória semântica, embeddings, reflexão, explicações
  por modelo, comparação entre provedores.
- **Fase 4:** HMM, regimes complexos, otimização multiobjetivo, estudos históricos
  maiores, dados externos, validação com usuários reais.

## 7. Commits desta fase

1. `docs: define Synthetic Portfolio Lab scope`
2. `feat: add persona and scenario schemas`
3. `feat: add rule-based persona agents`
4. `feat: add forecasting baselines`
5. `feat: add behavioral portfolio construction`
6. `feat: add portfolio evaluation metrics`
7. `test: cover Synthetic Portfolio Lab core`
8. `docs: record Phase 1 results`

## 8. Critérios de aceitação da Fase 1

Ver PRODUCT_SPEC §5. Resumo: 6 personas; múltiplos cenários com probabilidades;
decisões por regras que **diferem entre personas**; 1 portfólio por persona com
Σ pesos = 100% e restrições respeitadas; avaliação por cenário; comparação com
equal weight; métricas básicas; replay por semente; exportação JSON; testes passam;
sem LLM real; sem ordens reais; Capital Scope existente continua funcionando.
