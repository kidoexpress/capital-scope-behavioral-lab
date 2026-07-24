# Capital Scope Behavioral Lab — Product Spec

## 1. Visão

Um laboratório interativo para testar como diferentes **perfis de investidores
sintéticos** reagem a:

- choques de mercado;
- comunicações financeiras;
- recomendações;
- alterações de risco;
- intervenções de assessores;
- mercados com feedback positivo e negativo.

## 2. Use case principal do MVP

Comparar **duas intervenções de comunicação financeira** em condições controladas.

- **Controle:** mensagem genérica após uma queda de mercado.
- **Tratamento:** mensagem com contexto, impacto sobre a carteira, explicação de
  risco e opção de falar com um assessor.

As duas variantes compartilham **tudo**, exceto a intervenção:

- mesmas personas;
- mesma semente (seed);
- mesmo mercado;
- mesmo estado inicial;
- mesmos choques;
- mesmo período de intervenção.

## 3. Outcome principal

```
Intervention Effect Score =
    taxa de comportamento adverso no CONTROLE
  − taxa de comportamento adverso no TRATAMENTO
```

Comportamentos adversos iniciais:

- venda por pânico (`panic_sell`);
- violação do perfil de risco (`profile_violation`);
- turnover excessivo (`excessive_turnover`);
- migração excessiva para caixa (`excessive_cash_shift`);
- decisão com baixa compreensão (`low_understanding_decision`);
- mudança de estratégia sem causa observável (`unexplained_strategy_switch`).

## 4. Personas iniciais

| Persona | Traços principais |
|---|---|
| **Conservative** | baixa tolerância a risco, alta aversão a perdas, baixa sensibilidade a tendências, preferência por liquidez |
| **Fundamentalist** | orientação ao valor fundamental, expectativa de retorno ao valor 60 |
| **Trend Follower** | alta sensibilidade às últimas variações, maior tolerância a risco |
| **Contrarian** | expectativa de reversão após movimentos fortes, sensibilidade negativa a tendências |

### Estado mínimo de cada persona

`risk_tolerance`, `loss_aversion`, `trend_sensitivity`, `advisor_trust`,
`ai_trust`, `liquidity_preference`, `confidence`, `memory_length`,
`current_portfolio`, `accumulated_earnings`, `previous_forecasts`, `previous_actions`.

## 5. Saída estruturada dos agentes

Os agentes **nunca** produzem texto livre como resultado operacional. A saída segue
um schema validado:

```json
{
  "forecast": 65.4,
  "confidence": 0.72,
  "portfolio_action": "HOLD",
  "allocation_change": 0.0,
  "request_advisor": false,
  "reason_codes": ["recent_uptrend", "within_risk_limit"]
}
```

Ações aceitas: `BUY`, `SELL`, `HOLD`, `MOVE_TO_CASH`, `REQUEST_REVIEW`.

## 6. Métricas previstas

**Comportamentais:** `panic_sell_rate`, `advisor_escalation_rate`,
`profile_violation_rate`, `average_turnover`, `average_cash_shift`,
`average_confidence_change`, `persona_adherence_score`,
`unexplained_strategy_switch_rate`.

**Mercado:** `forecast_rmse`, `forecast_dispersion`, `price_volatility`,
`convergence_time`, `maximum_deviation_from_fundamental`, `bubble_amplitude`.

**Estratégia:** `alpha_1`, `alpha_2`, `beta` (ver Research Spec).

## 7. Linha de chegada do MVP

O MVP estará completo quando um usuário conseguir:

1. criar um experimento;
2. escolher feedback positivo ou negativo;
3. selecionar uma população de seis agentes;
4. configurar memória (1, 3 ou 5 períodos);
5. definir controle e tratamento;
6. executar cinquenta períodos;
7. repetir vinte execuções por variante;
8. acompanhar o mercado em uma interface;
9. comparar as métricas;
10. exportar os resultados;
11. reproduzir uma execução (replay determinístico);
12. verificar todas as decisões em uma trilha de auditoria.

## 8. Restrições de segurança do produto

A LLM (quando existir, fora do MVP) **nunca** poderá alterar diretamente: preço,
saldo, carteira, resultado financeiro, equações, regras de mercado, métricas ou
registros persistidos. Ela apenas **propõe** previsões e ações estruturadas; o
**motor determinístico** valida e executa. Nenhuma operação real de investimento é
realizada e nada aqui é aconselhamento financeiro.
