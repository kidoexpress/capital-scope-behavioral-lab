# Financial Twin — Quiz Spec

Meta de duração: **6–9 min**. **32** perguntas principais + até **12** adaptativas
(máx **44**). Escala Likert 1–5 (Discordo totalmente → Concordo totalmente). Itens
com **pontuação invertida** para reduzir respostas automáticas. **Não** copiar itens
protegidos de testes comerciais — usar itens originais/licença compatível.

## Módulo A — Big Five (4 itens/dimensão, peso SECUNDÁRIO)

Dimensões: `openness`, `conscientiousness`, `extraversion`, `agreeableness`,
`emotional_stability`.

Pode afetar: busca por novidade, disciplina de longo prazo, reação emocional à
volatilidade, necessidade de validação externa, frequência de acompanhamento.
**Não pode, sozinho, determinar**: % de ações, limite de risco, horizonte, liquidez.

Itens originais (exemplos): "Gosto de avaliar novas possibilidades, mesmo quando já
tenho uma opção conhecida." · "Costumo seguir planos financeiros que defini." ·
"Uma queda inesperada tende a ocupar meus pensamentos por bastante tempo." (invertido
para emotional_stability) · "Sinto necessidade de conversar com outras pessoas antes
de decisões importantes." · "Prefiro decisões previsíveis a opções com resultados
muito diferentes."

## Módulo B — Comportamento financeiro

`loss_aversion`, `ambiguity_aversion`, `present_bias`, `overconfidence`, `herding`,
`status_quo_bias`, `anchoring`, `disposition_effect`, `mental_accounting`,
`regret_aversion`, `financial_self_control`, `savings_discipline`,
`liquidity_anxiety`, `debt_comfort`, `advisor_trust`, `ai_trust`.

## Módulo C — Comportamento de consumo

`impulsive_spending`, `status_consumption`, `discount_sensitivity`,
`planned_consumption`, `future_orientation`, `emergency_preparedness`,
`lifestyle_inflation`, `subscription_awareness`, `credit_dependence`,
`spending_regret`.

## Módulo D — Hábitos de investimento

`monitoring_frequency`, `trading_impulsivity`, `strategy_commitment`,
`information_seeking`, `source_dependence`, `reaction_to_news`,
`reaction_to_losses`, `reaction_to_gains`, `diversification_preference`,
`concentration_preference`.

## Item schema

```
{ "question_id", "version", "module": "A|B|C|D",
  "dimension", "text", "reverse_scored": bool, "type": "likert_5",
  "weight": 1.0, "sensitive": false }
```

## Cenários comportamentais (Etapa 4)

10 cenários com 3–5 opções concretas (não afirmações). Ex.: **Queda de mercado**
(−12% em 2 meses): A vender grande parte · B reduzir parte do risco · C manter ·
D investir mais · E procurar assessor. Demais: alta recente/manada, necessidade de
liquidez, investimento no prejuízo, recomendação de IA, recomendação humana, juros
mais altos, ganho inesperado, bolha, longo período sem resultado.

Cada resposta de cenário registra: `choice`, `intensity`, `confidence`,
`response_time_ms`, `requested_info`, `changed_after_info`, `changed_after_social`.

## Perguntas adaptativas (até 12)

Disparadas quando: declarado × cenário conflitam; respostas uniformes (straight-line);
dimensão com baixa confiança; tolerância × capacidade divergem; decisões mudam muito
por fonte; forte manada; baixa consistência. Ex.: usuário declara aceitar
volatilidade mas vende em toda queda → "Você manteria a carteira se soubesse que
quedas semelhantes ocorreram várias vezes e a recuperação poderia levar 2+ anos?"

## Consentimento (Etapa 1)

Explica dados pedidos/uso, que o resultado é estimativa, que pode apagar respostas,
que sensíveis são opcionais, e que o sistema não executa operações reais. Checkbox de
consentimento (versionado), política de armazenamento, opção de não salvar, apagar
gêmeo, exportar dados. **Não** solicitar obrigatoriamente raça, religião, orientação
sexual, diagnóstico/dados de saúde, opinião política — e esses **não** afetam a carteira.

## Versionamento

`quiz_version` em toda definição/sessão/resposta. Uma mudança de versão **não** altera
silenciosamente resultados antigos (resultados guardam a versão que os gerou).
