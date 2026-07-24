# Capital Scope Behavioral Lab

> Laboratório interativo para testar como investidores sintéticos respondem a
> diferentes condições de mercado e intervenções financeiras.

Capital Scope Behavioral Lab é uma evolução do **Capital Scope Terminal** voltada a
**experimentos com agentes investidores sintéticos**. Ele reaproveita a
infraestrutura quantitativa existente (paper trading, métricas, gráficos, design
system) e adiciona um módulo isolado de simulação comportamental inspirado no paper:

> **Can Generative AI Agents Behave Like Humans? Evidence from Laboratory Market
> Experiments** — arXiv:2505.07457
> (cópia local em [`docs/references/2505.07457v1.pdf`](docs/references/2505.07457v1.pdf))

O caso de uso principal do MVP é **comparar duas intervenções de comunicação
financeira** em condições controladas (controle vs. tratamento), medindo o
**Intervention Effect Score** e um conjunto de métricas comportamentais e de mercado.

> ⚠️ **Isto não é aconselhamento financeiro.** Não há dinheiro real, corretora, nem
> execução de ordens reais. Os agentes operam sobre um motor de simulação
> determinístico. O MVP **não** faz chamadas reais de LLM (apenas agentes baseados em regras).

---

## Status

Esta etapa entrega **duplicação, isolamento, rename, documentação e o scaffold vazio**
do módulo Behavioral Lab (tipos, schemas e interfaces). A primeira implementação
funcional (agentes baseados em regras + motor de simulação) vem em uma etapa seguinte.

Veja o plano completo em
[`docs/BEHAVIORAL_LAB_IMPLEMENTATION_PLAN.md`](docs/BEHAVIORAL_LAB_IMPLEMENTATION_PLAN.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [Product Spec](docs/BEHAVIORAL_LAB_PRODUCT_SPEC.md) | Use case, MVP, personas, métricas, linha de chegada |
| [Research Spec](docs/BEHAVIORAL_LAB_RESEARCH_SPEC.md) | Base científica, equações, desenho experimental |
| [Implementation Plan](docs/BEHAVIORAL_LAB_IMPLEMENTATION_PLAN.md) | Fases, arquitetura do módulo, interfaces |
| [Duplication Report](docs/REPOSITORY_DUPLICATION_REPORT.md) | Origem, remotes, branches, commit-base |
| [Security & Environment](docs/SECURITY_AND_ENVIRONMENT_CHECKLIST.md) | Segredos, isolamento, serviços a recredenciar |
| [Architecture](docs/ARCHITECTURE.md) | Arquitetura herdada do Capital Scope Terminal |

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| Estado | Zustand (persistência em localStorage) |
| Gráficos | Recharts |
| Backend | FastAPI (Python) |
| Dados de mercado | yfinance (Yahoo Finance) |
| IA (opcional, fora do MVP do Lab) | Anthropic Claude |
| Testes backend | pytest |

## Setup

### Pré-requisitos

- Node.js 20+
- Python 3.10+
- (Opcional) Chave da Anthropic — os agentes de IA herdados rodam em modo demo sem ela.

### 1. Instalar

```bash
cd capital-scope-behavioral-lab
npm install
pip install -r requirements.txt
```

### 2. Configurar ambiente

```bash
cp .env.example .env.local
# Edite .env.local e adicione suas chaves (nunca comite .env.local)
```

### 3. Rodar (dois servidores em paralelo — **portas isoladas**)

O Behavioral Lab usa portas próprias (**5273 / 8100**) para poder rodar ao lado do
Capital Scope Terminal original (5173 / 8000) sem colisão.

```bash
# Terminal 1 — Backend (FastAPI)
uvicorn main:app --reload --port 8100

# Terminal 2 — Frontend (Vite)
npm run dev
```

Abra http://localhost:5273

### 4. Build de produção

```bash
npm run build
uvicorn main:app --port 8100
# Sirva a pasta dist/ com qualquer host estático ou nginx
```

## Testes

```bash
python -m pytest           # testes do motor de paper trading (herdados)
npm run lint               # eslint
npm run build              # inclui type-check (tsc -b)
```

## Relação com o upstream

Este repositório foi duplicado de `CapitalScope-Terminal` preservando todo o
histórico Git. O remote `capital-scope-upstream` aponta para o repositório original
**apenas como referência** para eventuais cherry-picks. Nenhum merge automático é feito.

## Aviso legal

Todo conteúdo é para fins **educacionais e de pesquisa**. Não é aconselhamento
financeiro. Nenhuma operação real de investimento é executada.
