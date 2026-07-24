# Capital Scope Behavioral Lab — Implementation Plan

## 1. Princípios

- **Reaproveitar** o Capital Scope Terminal (auth, layout, design system, gráficos,
  rotas, formulários, banco, exportação, séries temporais, infra local).
- **Isolar** o Behavioral Lab em um módulo próprio: `src/behavioral-lab/`.
- **Não** reescrever o app existente nem mover componentes sem necessidade.
- **Não** começar pela interface visual, nem por chamadas reais de LLM.
- Primeiro os **agentes baseados em regras**; LLM depois.

## 2. Estrutura do módulo (`src/behavioral-lab/`)

```
src/behavioral-lab/
  agents/         # InvestorAgent + implementações (Rule/LLM/Hybrid/HumanReplay)
  personas/       # definições e estado das 4 personas
  simulation/     # motor determinístico (equações, PRNG semeado, loop de períodos)
  experiments/    # configuração/execução de experimentos e variantes
  interventions/  # controle vs. tratamento (mensagens de comunicação financeira)
  metrics/        # métricas comportamentais, de mercado e de estratégia
  replay/         # replay determinístico + trilha de auditoria
  schemas/        # schemas validados de I/O (agent output, config, resultados)
  services/       # orquestração, persistência, exportação
  components/     # UI do Lab (isolada)
  pages/          # páginas/rotas do Lab
  tests/          # testes de unidade e de propriedade (determinismo)
```

## 3. Interfaces centrais

```ts
interface InvestorAgent {
  decide(
    observation: MarketObservation,
    memory: AgentMemory,
    intervention: Intervention | null
  ): AgentDecision; // valida contra o schema
}
```

Implementações futuras (nesta ordem):

1. `RuleBasedInvestorAgent` — deriva previsão/ação dos traços da persona (sem LLM).
2. `LLMInvestorAgent` — **fora do MVP**; propõe ações via LLM, validadas pelo motor.
3. `HybridInvestorAgent` — combina regras + LLM.
4. `HumanReplayAgent` — reproduz decisões humanas gravadas.

O **motor determinístico** é a única autoridade sobre preço, saldo, carteira,
resultado, equações, regras e registros. Os agentes apenas **propõem**.

## 4. Fases de desenvolvimento

Esta etapa (concluída):

1. Inspeção da arquitetura existente.
2. Documentação do plano (este documento + specs).
3. Scaffold **vazio** do módulo.
4. Tipos e schemas centrais.
5. Interfaces do motor de simulação.
6. Branch de implementação criada.
7. Preparação dos testes.
8. Confirmação de que o app existente continua iniciando.

Próximas etapas (fora deste PR):

- Motor de simulação determinístico + testes de determinismo por semente.
- `RuleBasedInvestorAgent` e as 4 personas.
- Runner de experimentos (20 execuções × 2 variantes × 50 períodos).
- Cálculo de métricas + Intervention Effect Score.
- UI de criação/execução/comparação + exportação.
- Replay + trilha de auditoria.
- (Posterior) camada LLM.

## 5. Estratégia de commits desta etapa

1. `chore: duplicate Capital Scope 2 into Behavioral Lab repository`
2. `chore: isolate environment and external services`
3. `chore: rename application to Capital Scope Behavioral Lab`
4. `docs: add Behavioral Lab product and research specifications`
5. `feat: scaffold Behavioral Lab module`
6. `test: add initial module and configuration checks`

## 6. Reuso a partir do Capital Scope Terminal

| Recurso existente | Reuso no Lab |
|---|---|
| Recharts + componentes de gráfico | séries de preço/previsão do mercado simulado |
| Zustand store | estado de experimentos (chave de persistência isolada) |
| `excelExport.ts` | exportação de resultados/métricas |
| Rotas React Router | adicionar rotas do Lab sob um namespace próprio |
| FastAPI + pytest | serviços/persistência do Lab e testes de backend |

Nada disso é movido ou reescrito; o Lab consome o que já existe.
