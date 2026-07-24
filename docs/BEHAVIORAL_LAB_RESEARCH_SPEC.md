# Capital Scope Behavioral Lab — Research Spec

## 1. Base científica

Referência: **Can Generative AI Agents Behave Like Humans? Evidence from Laboratory
Market Experiments**, arXiv:2505.07457
(cópia local: [`references/2505.07457v1.pdf`](references/2505.07457v1.pdf)).

## 2. Desenho experimental inicial

- **6 agentes** por mercado;
- **50 períodos** por execução;
- previsões entre **1 e 100**;
- **valor fundamental inicial = 60**;
- mercados com **feedback positivo** e **feedback negativo**;
- **memória** configurável em **1, 3 ou 5** períodos;
- **sementes controladas** (reprodutibilidade);
- **múltiplas execuções** (20 por variante no MVP);
- comparação entre agentes e entre condições.

## 3. Equações de mercado (motor determinístico)

Feedback **positivo**:

```
p_t = (20 / 21) * (average_forecast_t + 3) + epsilon_t
```

Feedback **negativo**:

```
p_t = (20 / 21) * (123 - average_forecast_t) + epsilon_t
```

Onde `epsilon_t ~ Normal(média = 0, variância = 1/4)`.

O ruído `epsilon_t` é gerado a partir de um **PRNG semeado** para garantir replay
determinístico. `average_forecast_t` é a média das previsões válidas dos agentes no
período `t`.

## 4. Modelo de estimação de estratégia

Para cada agente `h`, estima-se o comportamento de previsão:

```
forecast_h_t =
      alpha_1 * price_{t-1}
    + alpha_2 * forecast_h_{t-1}
    + (1 - alpha_1 - alpha_2) * 60
    + beta * (price_{t-1} - price_{t-2})
    + error
```

Interpretação de `beta`:

- `beta > 0`  → comportamento de tendência (trend-following);
- `beta ≈ 0`  → baixa sensibilidade à tendência;
- `beta < 0`  → expectativa de reversão (contrarian).

## 5. Métricas de mercado

- `forecast_rmse` — erro das previsões vs. preço realizado;
- `forecast_dispersion` — dispersão entre agentes;
- `price_volatility` — volatilidade do preço;
- `convergence_time` — período até convergência ao fundamental;
- `maximum_deviation_from_fundamental` — desvio máximo de 60;
- `bubble_amplitude` — amplitude de bolha/afundamento.

## 6. Reprodutibilidade

Toda execução é definida por: `{ seed, feedback_type, personas[], memory_length,
periods, intervention_schedule }`. Dado o mesmo tuplo de entrada, o motor deve
produzir exatamente a mesma série de preços, previsões e ações — condição necessária
para o **replay** e a **trilha de auditoria**.

## 7. Limites do MVP

- Sem chamadas reais de LLM: os agentes são **baseados em regras** derivadas dos
  traços de persona.
- Sem integração com corretoras, sem dinheiro real, sem execução de ordens reais.
- A camada de IA (LLMInvestorAgent / HybridInvestorAgent) é especificada mas **não**
  implementada nesta etapa.
