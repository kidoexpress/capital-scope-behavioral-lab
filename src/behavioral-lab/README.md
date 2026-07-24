# `src/behavioral-lab/` — Behavioral Lab module

Isolated module for synthetic-investor market experiments. **Scaffold only** in
this step: types, schemas and interfaces. No functional engine, no UI wiring, no
LLM calls.

## Layout

| Dir | Role | Status |
|---|---|---|
| `schemas/` | shared types + runtime validators (`validateAgentDecision`) | types + validator |
| `personas/` | 4 persona types, traits, presets | types + presets |
| `agents/` | `InvestorAgent` contract, observation/memory types | interface |
| `simulation/` | seeded PRNG, market equations, engine interface | equations + PRNG + stub |
| `interventions/` | control vs. treatment message shapes | types + canonical presets |
| `metrics/` | behavioral / market / strategy metric shapes | types |
| `replay/` | replay bundle + audit trail | types |
| `experiments/` | experiment orchestration | placeholder |
| `services/` | persistence/export orchestration | placeholder |
| `components/`, `pages/` | Lab UI | placeholder (not built yet) |
| `tests/` | unit + determinism tests | initial checks |

## Guarantees

- Agents **propose**; the deterministic engine **validates and executes**.
- The only randomness is `epsilon ~ Normal(0, 1/4)`, drawn from a **seeded** PRNG,
  so runs are reproducible (replay + audit).
- See `../../docs/BEHAVIORAL_LAB_*` for product/research/implementation specs.
