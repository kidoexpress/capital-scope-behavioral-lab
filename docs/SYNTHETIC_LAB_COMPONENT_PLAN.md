# Synthetic Lab — Component & Data Plan (Phase 1)

Separation of concerns: **layout · presentation · state · financial logic · data
fetching** are distinct. No calculations in React. No `any`. No duplicated schemas.

## Directory layout (frontend)

```
src/features/synthetic-lab/
  SyntheticLabShell.tsx        # layout + stepper + step outlet + advanced drawer
  SyntheticLabStepper.tsx      # progress; current/done/future; keyboard nav
  state/
    useSyntheticLabState.ts    # step state + answers + localStorage persistence
    viewModels.ts              # typed view models (see below)
  steps/
    IntroductionStep.tsx
    FinancialProfileStep.tsx
    BehaviorQuizStep.tsx
    DecisionScenariosStep.tsx
    FinancialTwinStep.tsx
    PortfolioStep.tsx
    ForecastStep.tsx
  components/
    ProgressSummary.tsx  QuestionCard.tsx  LikertScale.tsx
    ScenarioDecisionCard.tsx  ConfidenceSelector.tsx
    FinancialTwinSummary.tsx  TraitScoreBar.tsx  RiskComparison.tsx
    PortfolioAllocation.tsx  AllocationTable.tsx  PortfolioComparison.tsx
    BehavioralFitSummary.tsx
    ForecastFanChart.tsx  ForecastHorizonSelector.tsx  ScenarioResultCard.tsx
    StressTestTable.tsx  MethodologyPanel.tsx
    AdvancedSettingsDrawer.tsx  SimulationProgress.tsx
    InlineDisclaimer.tsx  ResultExplanation.tsx  MobileBottomAction.tsx
  services/  (reuse src/services/syntheticPortfolioApi.ts; extend, don't duplicate)
  tests/
```

Keep components small; each does one thing. Presentational components receive typed
props only.

## View models (presentation-only types, no `any`)

```ts
type FinancialTwinViewModel = {
  profileName: string; description: string; confidence: number;
  riskCapacity: number; statedRisk: number; revealedRisk: number;
  traits: TraitViewModel[]; reactions: ReactionViewModel[];
};
type TraitViewModel = { key: string; label: string; score: number;
  explanation: string; confidence: number };
type ReactionViewModel = { event: string;
  actions: { action: string; probability: number }[] };
type AllocationViewModel = { className: string; label: string; weight: number;
  role: string; liquidity: number; risk: number }[];
type ForecastViewModel = { horizonMonths: 3|6|12;
  median: number; p05: number; p25: number; p75: number; p95: number;
  probabilityOfLoss: number; probabilityOfGoal: number; paths?: number[][] };
```

View models are built in a mapping layer from the API responses — **components never
compute finance**.

## Data source mapping (real data only; never fabricate)

| UI step | Data source | Status |
|---|---|---|
| Profile | user input (local) | new UI, no calc |
| Quiz / Scenarios | user input (local) | new UI, no calc |
| **Twin** (traits, capacity/stated/revealed, reactions) | `financial_twin_lab` scoring (already computes these) | **needs thin API endpoint** to expose existing scores |
| Portfolio (allocation, metrics, why, comparison) | `synthetic_portfolio_lab` suggestion (`/run`) — exists | reuse; may add class-level aggregation server-side |
| Forecast (3/6/12m percentiles, stress) | `synthetic_portfolio_lab.forecasting` (percentile distributions exist) | **needs thin API endpoint** to expose portfolio forecast/stress |

Where an endpoint is not yet wired, the step renders an explicit **"not available
yet"** state — **no fake numbers**. Exposing existing engines via endpoints is
plumbing, not new financial logic.

## Design tokens

Reuse existing CSS variables: colors (`--accent`, `--green`, `--red`, `--amber`,
`--bg-*`, `--border-*`, `--text-*`), and add documented tokens only where missing:
spacing scale (8px multiples), radius (10–16), typography sizes (page 32–36, section
20–24, card 16–18, body 14–16, support 13–14), breakpoints (1440/1280/1024/768/390).
**No stray hex in components.** Accent used only for primary action / current step /
selected / key chart line / important highlight. Semantic colors always paired with
icon + text/label (never color alone). Fewer borders; prefer surfaces + spacing +
discreet dividers; consistent radius; minimal shadow in dark theme.

## Accessibility

WCAG AA contrast; visible focus; full keyboard; labels + aria; correct screen-reader
order; clear button names; **text summary for every chart**; `prefers-reduced-motion`
respected; adequate hit areas; no color-only state.

## Testing plan

- **Add tooling:** `vitest` (present) + `jsdom` + `@testing-library/react` (+ user-event).
  Justified — required for UI unit/integration tests.
- **Unit:** stepper, progress, selection, question rendering, scenario rendering,
  results rendering, empty/error states, Advanced Settings, metric formatting,
  responsive logic helpers.
- **Integration:** start flow → profile → quiz → scenarios → twin → portfolio →
  forecast; back without losing answers; reload without losing progress.
- **E2E:** Playwright is **not** installed; proposed for desktop+mobile in Phase 7
  (add only with buy-in), otherwise integration tests via RTL cover the flow.

## Performance

Lazy-load forecast, stress tests, methodology, heavy charts. Memoize lists. Avoid
loading charts before their step. No duplicate API calls. No heavy computation on the
frontend.

## Commit sequence

1. docs: audit Synthetic Lab user experience *(this)*
2. feat: add guided Synthetic Lab flow (shell + stepper + state + intro)
3. feat: add financial profile and quiz experience
4. feat: add scenario decision experience
5. feat: redesign financial twin results
6. feat: redesign portfolio results
7. feat: add probabilistic forecast experience
8. fix: improve accessibility and responsive behavior
9. test: cover Synthetic Lab user flow
