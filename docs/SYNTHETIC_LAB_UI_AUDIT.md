# Synthetic Lab — UI/UX Audit (Phase 1)

Branch: `feature/financial-twin-ux-redesign` (base `feat/financial-twin-lab`).
Scope: redesign the Synthetic Lab **experience only**. Financial logic and existing
calculations are preserved — no calculation moves into React.

## 1. Current architecture (what exists today)

| Aspect | Current state |
|---|---|
| Route | `/synthetic-portfolio-lab` (single route) → `src/pages/SyntheticPortfolioLab.tsx` (303 lines) |
| Sidebar item | "Synthetic Lab" (keep — single item) |
| State | Local `useState` only (personas, scenarios, selected persona, `selScenarios` Set, seed, useMemory, loading, error, suggestion, meta). **No global state, no persistence.** |
| Data / API | Real API — `src/services/syntheticPortfolioApi.ts`: `fetchTemplates()` (`GET /api/synthetic-portfolio/templates`), `runSimulation()` (`POST /api/synthetic-portfolio/run`). **No mock data.** |
| Financial logic | Backend Python `synthetic_portfolio_lab/` (personas → portfolio → metrics → suggestion) via `explanations/suggestion.py`. **Preserve as-is.** |
| Charts | None — allocation is plain `<div>` bars. `recharts@3.8` is available but unused here. |
| Styling / design system | Inline styles + CSS variables (`--accent`, `--green`, `--red`, `--bg-raised/surface`, `--border-soft/sub`, `--text-hi/mid/lo`). Some shared UI in `src/components/ui/`. Not standard shadcn. |
| Local components | `MetricTile`, `AllocBar` defined inline in the page. |
| Tests | Backend pytest (60). **No frontend test tooling** (`@testing-library`, `jsdom` not installed; `vitest@4` present for logic tests). |

## 2. Problems found (desktop / tablet / mobile)

1. **Everything on one screen.** Configuration (personas, 10 scenarios, seed, memory) and full results (fit, 6 metric tiles, allocation, why, per-scenario decisions, risks, disclaimer) share a single page → dense, technical, hard to parse. (All three breakpoints.)
2. **All options exposed at once.** 6 persona chips + 10 scenario chips visible simultaneously — no progressive disclosure.
3. **Blue outline overload.** The accent (indigo) is used as a border on nearly every chip and the metric tiles, so nothing reads as "primary". Violates "use accent only for primary action / current step / selected / key highlight".
4. **Technical uppercase labels.** `INVESTOR PROFILE (PERSONA)`, `SCENARIOS TO TEST`, `EST. SCENARIO RETURN`, `BEHAVIORAL FIT`, `SIMULATED SUGGESTION` — jargon + excessive caps hurt legibility.
5. **Long disclaimer under the title** competes with the H1 for attention.
6. **Metric overload.** 6 equally-weighted metric tiles; no primary/secondary hierarchy.
7. **Persona is picked manually** instead of being *created* from behavior — the product intent (a synthetic twin) is not expressed by the UI.
8. **No guided flow / progress.** User cannot tell where they are, how much is left, or what the result will be.
9. **No interface states.** No skeletons, no staged "simulation running" progress (only a button spinner), thin empty state, minimal error affordance.
10. **Responsive gaps.** The global top ticker-tape overflows on mobile; results (2-col metric grid, 2-col allocation/why) are not re-flowed as a deliberate mobile experience.
11. **Accessibility.** Selection communicated by color/border only; labels are terse; no chart text summaries (no charts yet); focus states rely on defaults.

## 3. Components: keep vs. rebuild

**Keep (reuse):**
- Backend engine + API (`/api/synthetic-portfolio/*`) — the financial calculations. (May be **extended** with thin endpoints that expose *existing* engines — see §5.)
- `syntheticPortfolioApi.ts` service + types (extend, don't duplicate).
- App shell: sidebar item "Synthetic Lab", `Layout`, TopBar, CSS-variable theme.
- `formatCurrency`/finance utils; `src/components/ui/` primitives where useful.

**Rebuild (this task):**
- The entire `SyntheticPortfolioLab.tsx` page → a guided multi-step **shell** (see UX_FLOW doc). Split into small step components + presentational components + view models.
- `MetricTile`/`AllocBar` inline → proper reusable presentational components with hierarchy.
- Persona chips → **removed from main flow** (behavior quiz creates the profile); presets live only in **Demo profile**.
- Scenario chips → moved to their own **Decision Scenarios** step (and multi-select behind Advanced Settings for power users).
- Seed / memory → **Advanced Settings** drawer (closed by default).

## 4. Risks

- **Data gaps (highest risk).** The redesign asks for screens the current API does **not** yet feed with real data: twin **trait bars** (Loss sensitivity, Long-term discipline, …), **risk capacity vs stated vs revealed** split, **3/6/12-month fan chart**, **stress tests**, and **class-based allocation** (current API returns per-ticker `EQ_/FI_` weights). Mitigation: **expose existing engines** via thin endpoints (the `financial_twin_lab` scoring already computes capacity/tolerance/revealed + trait scores; `synthetic_portfolio_lab.forecasting` already produces percentile distributions). **Never fabricate data** — steps without a real data source render an explicit "not available yet" state, not fake numbers.
- **Scope.** This is a large rebuild; must ship in small commits without breaking the working page (keep `/synthetic-portfolio-lab` functional until the new flow reaches parity, then redirect).
- **No frontend test tooling.** Component/integration tests need `vitest` + `jsdom` + `@testing-library/react` added (justified). E2E would need Playwright (not installed) — proposed, not assumed.
- **Reduced-motion / a11y** must be built in, not retrofitted.

## 5. Implementation plan (phased, small commits)

Follows the task's phases. Financial calculations are **preserved**; where the UI needs data, we **expose existing engines** (plumbing), never invent numbers.

1. **Phase 1 — Audit** (this commit): docs + screenshots.
2. **Phase 2 — Shell & flow:** `SyntheticLabShell` + `SyntheticLabStepper`, per-step URL (`/synthetic-lab/:step`) with internal state, **progress persistence** (localStorage + URL step), base responsiveness, `AdvancedSettingsDrawer` (seed/memory/#sims), Introduction step. Old page kept reachable until parity.
3. **Phase 3 — Profile, Quiz, Scenarios:** financial profile blocks, one-question-at-a-time Likert quiz, scenario decision cards + confidence. (Quiz feeds the twin; wire to `financial_twin_lab` scoring via a thin endpoint.)
4. **Phase 4 — Financial Twin:** summary, horizontal trait bars, risk comparison (capacity/stated/revealed + gap), likely reactions — from real scores.
5. **Phase 5 — Portfolio:** conclusion-first header, class-based allocation, 3-portfolio comparison, "Why this portfolio" from real IDs, 3–4 primary metrics.
6. **Phase 6 — Forecast:** fan chart (recharts), horizon selector (3/6/12m), Overview/Scenarios/Stress/Method tabs — from the forecasting engine.
7. **Phase 7 — Polish:** a11y (WCAG AA, focus, keyboard, aria, chart text summaries), mobile, loading/skeleton/error/empty states, tests, performance (lazy-load forecast/stress/method), final screenshots.

## 6. Route & compatibility

Keep `/synthetic-portfolio-lab` working; introduce `/synthetic-lab` and per-step
sub-paths with internal state. Reload/refresh must not lose progress (localStorage +
URL step). The old route redirects to the new flow once it reaches parity.
