import { useEffect, useState } from 'react';
import { Info, Target } from 'lucide-react';
import {
  Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { color, radius, space, tint, type as t } from '../features/synthetic-lab/tokens';
import { Button, CurrencyInput, Eyebrow } from '../features/synthetic-lab/components/ui';
import { EngineError, EngineLoading } from '../features/synthetic-lab/components/TwinStates';
import {
  fetchThemes, fetchThematicPortfolio,
  type ThemeSummary, type ThematicResponse, type ThematicAllocationRow,
} from '../services/syntheticPortfolioApi';
import type { ForecastCheckpoint } from '../services/syntheticPortfolioApi';

const MIN_BUDGET = 1_000;
const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
const money = (x: number) => x.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function ThemeCard({ theme, selected, onClick }: { theme: ThemeSummary; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left', padding: space.md, borderRadius: radius.md, cursor: 'pointer',
        border: `1px solid ${selected ? color.accent : color.borderSub}`,
        background: selected ? tint(color.accent, 10) : color.surface,
        transition: 'background .12s, border-color .12s',
      }}
    >
      <div style={{ color: selected ? color.textHi : color.textMid, fontWeight: 700, fontSize: t.body }}>
        {theme.label}
      </div>
      <div style={{ color: color.textLo, fontSize: t.support, marginTop: 4 }}>
        {theme.instrument_count} {theme.instrument_count === 1 ? 'instrument' : 'instruments'}
        {theme.symbols.length > 0 && ` · ${theme.symbols.join(', ')}`}
      </div>
    </button>
  );
}

function AllocationRow({ row, max }: { row: ThematicAllocationRow; max: number }) {
  const wPct = max > 0 ? (row.weight / max) * 100 : 0;
  const rPct = max > 0 ? (row.risk_contribution / max) * 100 : 0;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'minmax(150px, 1.6fr) 2fr minmax(64px, auto) minmax(70px, auto)',
      gap: space.md, alignItems: 'center', padding: `${space.sm + 2}px 0`,
      borderBottom: `1px solid ${color.borderSub}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ color: color.textHi, fontSize: t.support + 1, fontWeight: 700 }}>{row.symbol}</span>
          <span style={{ color: color.textLo, fontSize: t.support - 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.name}
          </span>
        </div>
        <div style={{ color: color.textLo, fontSize: t.support - 2, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {row.country ? `${row.country} · ${row.sector}` : row.sector}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 3 }}>
        <div style={{ height: 8, borderRadius: 999, background: tint(color.textLo, 16), overflow: 'hidden' }}>
          <div style={{ width: `${wPct}%`, height: '100%', background: color.accent, borderRadius: 999 }} />
        </div>
        <div style={{ height: 8, borderRadius: 999, background: tint(color.textLo, 16), overflow: 'hidden' }}>
          <div style={{ width: `${rPct}%`, height: '100%', background: tint(color.warning, 70), borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ color: color.textHi, fontSize: t.support + 1, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct(row.weight)}
      </div>
      <div style={{ color: color.textMid, fontSize: t.support + 1, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {money(row.amount)}
      </div>
    </div>
  );
}

interface ChartRow { months: number; band90: [number, number]; band50: [number, number]; p50: number }
function toChartRows(checkpoints: ForecastCheckpoint[]): ChartRow[] {
  const zero: ChartRow = { months: 0, band90: [0, 0], band50: [0, 0], p50: 0 };
  return [zero, ...checkpoints.map((c) => ({
    months: c.months, band90: [c.p05, c.p95] as [number, number],
    band50: [c.p25, c.p75] as [number, number], p50: c.p50,
  }))];
}

// recharts' generic Tooltip `formatter` chokes on range-valued series (Area
// dataKeys that return a [min, max] tuple coerce through Number() to NaN,
// since Number() only unwraps single-element arrays) — a custom renderer
// that reads the row directly sidesteps that entirely.
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: ChartRow }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={{
      padding: `${space.sm}px ${space.md}px`, borderRadius: radius.sm,
      border: `1px solid ${color.borderSoft}`, background: color.raised,
      fontSize: t.support, color: color.textHi, boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Month {label}</div>
      <div style={{ color: color.textMid }}>Median: <strong style={{ color: color.textHi }}>{pct(row.p50)}</strong></div>
      <div style={{ color: color.textMid }}>50% range: {pct(row.band50[0])} to {pct(row.band50[1])}</div>
      <div style={{ color: color.textMid }}>90% range: {pct(row.band90[0])} to {pct(row.band90[1])}</div>
    </div>
  );
}

export default function ThematicLab() {
  const [themes, setThemes] = useState<ThemeSummary[] | null>(null);
  const [themesError, setThemesError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [budget, setBudget] = useState<number>(50_000);

  const [result, setResult] = useState<ThematicResponse | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes()
      .then((r) => setThemes(r.themes))
      .catch((err: unknown) => setThemesError(err instanceof Error ? err.message : 'Could not load themes.'));
  }, []);

  const budgetValid = Number.isFinite(budget) && budget >= MIN_BUDGET;
  const canBuild = selectedTheme !== null && budgetValid && !building;

  const build = () => {
    if (!selectedTheme || !budgetValid) return;
    setBuilding(true);
    setBuildError(null);
    fetchThematicPortfolio(selectedTheme, budget)
      .then(setResult)
      .catch((err: unknown) => setBuildError(err instanceof Error ? err.message : 'Could not build the portfolio.'))
      .finally(() => setBuilding(false));
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: `${space.xl}px ${space.lg}px` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
        <Target size={20} aria-hidden strokeWidth={1.75} style={{ color: color.accent }} />
        <span style={{ color: color.textLo, fontSize: t.support, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Independent of the Financial Twin flow
        </span>
      </div>
      <h1 style={{ fontSize: t.page, fontWeight: 700, letterSpacing: '-0.01em', color: color.textHi, margin: 0 }}>
        Thematic Lab
      </h1>
      <p style={{ fontSize: t.body, color: color.textMid, marginTop: space.sm, maxWidth: 640 }}>
        A deliberately concentrated portfolio in one theme — no quiz, no scenarios, just a focus and a
        budget. The Financial Twin Lab builds a diversified portfolio from your full behavioral profile;
        this builds a single-theme bet on purpose, sized with the same risk-parity engine.
      </p>

      <div style={{ marginTop: space.xl }}>
        <Eyebrow>Choose a theme</Eyebrow>
        <div style={{ marginTop: space.sm }}>
          {themesError && <EngineError message={themesError} endpoint="/api/synthetic-portfolio/themes" onRetry={() => window.location.reload()} />}
          {!themes && !themesError && <EngineLoading label="Loading available themes…" />}
          {themes && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: space.sm }}>
              {themes.map((th) => (
                <ThemeCard key={th.key} theme={th} selected={selectedTheme === th.key}
                  onClick={() => setSelectedTheme(th.key)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: space.xl }}>
        <Eyebrow>Budget</Eyebrow>
        <div style={{ marginTop: space.sm }}>
          <CurrencyInput value={Number.isNaN(budget) ? undefined : budget} onChange={setBudget} placeholder="50,000" min={0} style={{ maxWidth: 280 }} />
        </div>
      </div>

      <div style={{ marginTop: space.lg }}>
        <Button onClick={build} disabled={!canBuild}>
          {building ? 'Building…' : 'Build portfolio'}
        </Button>
        {selectedTheme && !budgetValid && (
          <p style={{ fontSize: 12, color: color.textLo, marginTop: space.sm }}>
            Set a budget of at least ${MIN_BUDGET.toLocaleString('en-US')}.
          </p>
        )}
      </div>

      {buildError && (
        <div style={{ marginTop: space.lg }}>
          <EngineError message={buildError} endpoint="/api/synthetic-portfolio/thematic" onRetry={build} />
        </div>
      )}

      {result && !buildError && (() => {
        const rows = result.allocation.filter((r) => r.weight > 0.0005);
        const max = Math.max(...rows.map((r) => Math.max(r.weight, r.risk_contribution)), 0.0001);
        const chartRows = toChartRows(result.forecast.checkpoints);
        const h12 = result.forecast.horizons['12m'];

        return (
          <div style={{ marginTop: space.xl }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.md,
              paddingBottom: space.md, borderBottom: `1px solid ${color.borderSub}`,
            }}>
              <h2 style={{ fontSize: t.section, fontWeight: 700, color: color.textHi, margin: 0 }}>
                {result.theme_label} · {money(result.budget)}
              </h2>
            </div>

            <div style={{
              display: 'grid', gap: space.md, marginBottom: space.lg,
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            }}>
              {[
                { label: 'Expected volatility', value: pct(result.risk.portfolio_volatility), hint: 'annualized' },
                { label: 'Diversification ratio', value: result.risk.diversification_ratio.toFixed(2), hint: '1.00 = none' },
                { label: 'Instruments', value: String(result.instrument_count), hint: 'in this theme' },
                { label: '12-month expected', value: pct(h12.expected_return), hint: `${Math.round(h12.downside_probability * 100)}% chance of a loss` },
              ].map((m) => (
                <div key={m.label} style={{
                  padding: space.md, borderRadius: radius.md,
                  border: `1px solid ${color.borderSub}`, background: color.surface,
                }}>
                  <div style={{ color: color.textLo, fontSize: t.support - 1, marginBottom: 6 }}>{m.label}</div>
                  <div style={{ color: color.textHi, fontSize: t.section, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {m.value}
                  </div>
                  <div style={{ color: color.textLo, fontSize: t.support - 1, marginTop: 2 }}>{m.hint}</div>
                </div>
              ))}
            </div>

            {result.instrument_count === 1 && (
              <div style={{
                display: 'flex', gap: space.md, padding: space.md, borderRadius: radius.md,
                border: `1px solid ${color.borderSub}`, background: tint(color.warning, 6), marginBottom: space.lg,
              }}>
                <Info size={16} aria-hidden strokeWidth={1.75} style={{ color: color.warning, flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: color.textMid, fontSize: t.support - 1, margin: 0, lineHeight: 1.5 }}>
                  This theme has only one instrument in the simulated universe, so the "portfolio" is a single
                  position by construction — there is nothing to diversify within it.
                </p>
              </div>
            )}

            <section style={{
              padding: space.lg, borderRadius: radius.lg,
              border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
            }}>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: space.md,
                alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.sm,
              }}>
                <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700 }}>Allocation</h3>
                <div style={{ display: 'flex', gap: space.md, fontSize: t.support - 1, color: color.textLo }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 8, borderRadius: 999, background: color.accent }} /> weight
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 8, borderRadius: 999, background: tint(color.warning, 70) }} /> risk share
                  </span>
                </div>
              </div>
              {rows.map((r) => <AllocationRow key={r.asset_id} row={r} max={max} />)}
            </section>

            <section style={{
              padding: space.lg, borderRadius: radius.lg,
              border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
            }}>
              <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700, marginBottom: space.sm }}>
                Projected range
              </h3>
              <p style={{ color: color.textLo, fontSize: t.support - 1, marginBottom: space.md }}>
                A concentrated theme swings harder than a diversified portfolio — this range is typically
                wider than what the Financial Twin Lab shows for the same budget.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={color.borderSub} vertical={false} />
                  <XAxis dataKey="months" stroke={color.textLo} tickLine={false} axisLine={false}
                    tickFormatter={(m) => `${m}m`} fontSize={12} />
                  <YAxis stroke={color.textLo} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${Math.round(v * 100)}%`} fontSize={12} width={48} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area dataKey="band90" stroke="none" fill={color.accent} fillOpacity={0.14} isAnimationActive={false} />
                  <Area dataKey="band50" stroke="none" fill={color.accent} fillOpacity={0.28} isAnimationActive={false} />
                  <Line dataKey="p50" stroke={color.accent} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </section>

            <p style={{ color: color.textLo, fontSize: t.support - 1 }}>{result.disclaimer}</p>
          </div>
        );
      })()}
    </div>
  );
}
