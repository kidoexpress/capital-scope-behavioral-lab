# Synthetic Lab → Financial Twin Lab — UX Flow (Phase 1)

Guided, step-based experience with **progressive disclosure**. One primary action
per step. Only the current step's information is shown; technical controls live in
**Advanced Settings** (closed by default).

## Stepper

Persistent at the top of the main content area:

```
Profile → Behavior → Scenarios → Your Twin → Portfolio → Forecast
```

(Introduction precedes the stepper as a landing step.) The user always sees: where
they are, what they're doing, how much is left, what the result will be, how to go
back, and that progress is saved. Steps completed = check; current = accent; future =
muted. Fully keyboard-navigable.

## Routing & persistence

- Base route `/synthetic-lab` (keep `/synthetic-portfolio-lab` → redirect at parity).
- Per-step URL: `/synthetic-lab/start|profile|quiz|scenarios|twin|portfolio|forecast`.
- Single React page with internal step state **plus** an updatable URL per step.
- **Refresh/reload must not lose progress** → persist answers + current step in
  `localStorage` (versioned key), rehydrate on load. "Saved draft" state shown.

## Steps

### 1. Introduction (`/start`)
Simple landing. Title **"Build your Financial Twin"** + one-paragraph description.
Three benefits (Understand your financial behavior · Test reactions to market events
· Build and simulate a portfolio). Info: ~6–9 min, answers reviewable, results
probabilistic, no real trades. Primary **"Create my Financial Twin"**; secondary
**"Use a demo profile"** (only place presets live). No charts/metrics here.

### 2. Financial Profile (`/profile`)
Short blocks (not all fields at once): goals · horizon · available capital · income
stability · emergency reserve · liquidity · experience · current portfolio ·
restrictions. Selection cards, sliders only where meaningful, range inputs,
examples, contextual help, inline validation. Desktop: discreet side column
(progress · answer summary · save). Mobile: summary below content. Primary
**Continue**, secondary **Back**.

### 3. Behavior Quiz (`/quiz`)
**One question at a time.** Progress · question number · question · options ·
optional explanation · Back · Continue · autosave. Likert = 5 visual options, labels
at the extremes, filled selected state, keyboard support, large hit areas. **No
scores shown while answering.** Short transition between questions.

### 4. Decision Scenarios (`/scenarios`)
Concrete situations as cards (one at a time or groups of ≤3, **not** 10 tiny chips).
Each: title · short context · key figure · action options · confidence · "ask for
more info". After selection → "How confident are you?". Example: *Market drops 15%*.

### 5. Financial Twin (`/twin`) — first result screen
Strong header **"Your Financial Twin"** + subtitle. Two-column summary:
- Left: profile name · short description · profile confidence · key behaviors.
- Right: **risk capacity · stated risk tolerance · revealed risk behavior · gap** —
  **horizontal bars** (no radar).
Five trait cards (score · label · one-sentence explanation · data confidence):
Loss sensitivity · Long-term discipline · Liquidity preference · External influence ·
Reaction to volatility. Section **"How your twin may react"** for moderate drop /
severe drop / strong rally, each with action probabilities. Primary **"Build my
portfolio"**; secondary **"Review my answers"**.

### 6. Portfolio (`/portfolio`)
Conclusion first, e.g. *"A balanced portfolio with a behavioral safety buffer"* +
subtitle. Desktop 12-col: left 7 (allocation · comparison · explanation), right 5
(metrics · risks · adjustments).
- **Allocation:** class-based (horizontal stacked bar + table by class: %, role,
  liquidity, risk). Classes: cash, floating-rate FI, inflation-linked, fixed-rate,
  private credit, BR equities, intl equities, real estate, commodities, gold.
  "Show representative assets" collapsed by default.
- **Comparison:** Current · Standard risk · Financial Twin — rows: expected return,
  volatility, expected drawdown, liquidity, behavior fit, probability of staying
  invested; highlight 3 primary.
- **Why this portfolio:** Your goals → capacity → behavior → scenario responses →
  constraints applied. Real data + IDs only, no generic text.
Primary **"Simulate future outcomes"**.

### 7. Future Simulation (`/forecast`)
Never a single line. **Fan chart / cone / percentile bands** with selectable horizon
(3/6/12 months), showing median, p25–p75, p05–p95, initial value, selected horizon.
Primary cards: median expected return · probability of loss · downside estimate ·
probability of reaching goal. Tabs:
- **Overview:** return distribution · expected final value · interval · loss chance ·
  vs. benchmarks.
- **Scenarios:** base / optimistic / adverse / severe-stress cards (return · final
  value · main risk · likely twin reaction).
- **Stress tests:** equities −10/−25%, inflation, rate, currency, emergency withdrawal.
- **Method:** data used · period · method · # simulations · limitations · seed ·
  model version (accessible; technical config also in Advanced Settings).

## Interface states (every data step)

empty · loading (skeletons) · **simulation running** (staged: Building your profile →
Testing behavior → Constructing portfolio → Running simulations → Preparing results,
never a bare spinner) · partial results · error (what happened · data preserved? ·
retry · alternative) · retry · saved draft · completed.

## Microcopy (technical → clear)

Synthetic Portfolio Lab → **Financial Twin Lab** · Simulated suggestion → **Portfolio
proposal** · Behavioral fit → **Match with your behavior** · Est. scenario return →
**Expected return** · Scenario survival → **Within your risk limits** · Why this
allocation → **Why this portfolio fits you** · Use persona memory → **Use previous
decisions** · Run simulation → **Simulate future outcomes**.

Disclaimer = short component: *"Simulated results, not guaranteed returns."* + link
**"How this works"** (full detail in a modal / the Method tab).

## Responsive

Test at 1440 / 1280 / 1024 / 768 / 390. Mobile: one column, full-width cards, reduced
stepper, fixed bottom CTA where useful, tables → cards, no horizontal page scroll,
collapsed sidebar (menu button). Desktop: max width 1200–1360, side padding 24–40,
12-col grid, 8px spacing scale, 32–48 between sections, 20–28 card padding.
