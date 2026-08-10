import { Info } from 'lucide-react';
import {
  Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { color, radius, space, tint, type as t } from '../tokens';
import { StepHeading } from '../components/ui';
import StepFooter from '../components/StepFooter';
import { EngineError, EngineLoading } from '../components/TwinStates';
import { useForecast } from '../state/useForecast';
import type { LabDraft } from '../state/useLabDraft';
import type { ForecastCheckpoint } from '../../../services/syntheticPortfolioApi';

interface Props {
  draft: LabDraft;
  onBack?: () => void;
  onContinue?: () => void;
}

const pct = (x: number, digits = 1) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(digits)}%`;
const money = (x: number) => x.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface ChartRow {
  months: number;
  band90: [number, number];
  band50: [number, number];
  p50: number;
}

function toChartRows(checkpoints: ForecastCheckpoint[]): ChartRow[] {
  const zero: ChartRow = { months: 0, band90: [0, 0], band50: [0, 0], p50: 0 };
  return [zero, ...checkpoints.map((c) => ({
    months: c.months,
    band90: [c.p05, c.p95] as [number, number],
    band50: [c.p25, c.p75] as [number, number],
    p50: c.p50,
  }))];
}

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

function HorizonCard({ label, checkpoint, portfolioValue }: {
  label: string; checkpoint: ForecastCheckpoint; portfolioValue: number;
}) {
  return (
    <div style={{
      padding: space.lg, borderRadius: radius.lg,
      border: `1px solid ${color.borderSub}`, background: color.surface,
    }}>
      <div style={{ color: color.textLo, fontSize: t.support, marginBottom: space.sm }}>{label}</div>
      <div style={{
        color: checkpoint.expected_return >= 0 ? color.positive : color.danger,
        fontSize: t.section, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
      }}>
        {pct(checkpoint.expected_return)}
      </div>
      <div style={{ color: color.textMid, fontSize: t.support, marginTop: 2 }}>
        {money(portfolioValue * (1 + checkpoint.expected_return))} expected
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: space.md,
        paddingTop: space.sm, borderTop: `1px solid ${color.borderSub}`,
        fontSize: t.support - 1, color: color.textLo,
      }}>
        <span>p05 {pct(checkpoint.p05)}</span>
        <span>p95 {pct(checkpoint.p95)}</span>
      </div>
      <div style={{ fontSize: t.support - 1, color: color.textLo, marginTop: 4 }}>
        {Math.round(checkpoint.downside_probability * 100)}% chance of a loss at this horizon
      </div>
    </div>
  );
}

export default function ForecastStep({ draft, onBack, onContinue }: Props) {
  const { data, loading, error, reload } = useForecast(draft);

  return (
    <div style={{ maxWidth: 920 }}>
      <StepHeading
        title="Future simulation"
        description="A range of possible outcomes for 3, 6 and 12 months — never a single guaranteed line."
      />

      {loading && <EngineLoading label="Bootstrapping thousands of possible paths…" />}
      {error && !loading && <EngineError message={error} onRetry={reload} />}

      {data && !loading && !error && (() => {
        const { forecast, portfolio_value: portfolioValue } = data;
        const rows = toChartRows(forecast.checkpoints);
        const h = forecast.horizons;

        if (forecast.observations < 2) {
          return (
            <div style={{
              padding: space.lg, borderRadius: radius.md,
              border: `1px solid ${tint(color.warning, 35)}`, background: tint(color.warning, 7),
              color: color.textMid, fontSize: t.support + 1, marginBottom: space.md,
            }}>
              Not enough simulated history to project this portfolio. Go back and adjust your answers.
            </div>
          );
        }

        return (
          <>
            <div style={{
              display: 'grid', gap: space.md, marginBottom: space.lg,
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}>
              <HorizonCard label="3 months" checkpoint={h['3m']} portfolioValue={portfolioValue} />
              <HorizonCard label="6 months" checkpoint={h['6m']} portfolioValue={portfolioValue} />
              <HorizonCard label="12 months" checkpoint={h['12m']} portfolioValue={portfolioValue} />
            </div>

            <section style={{
              padding: space.lg, borderRadius: radius.lg,
              border: `1px solid ${color.borderSub}`, background: color.surface, marginBottom: space.lg,
            }}>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: space.md,
                alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.sm,
              }}>
                <h3 style={{ color: color.textHi, fontSize: t.card, fontWeight: 700 }}>Projected range</h3>
                <div style={{ display: 'flex', gap: space.md, fontSize: t.support - 1, color: color.textLo }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 8, borderRadius: 3, background: tint(color.accent, 22) }} /> 90% of outcomes
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 8, borderRadius: 3, background: tint(color.accent, 45) }} /> 50% of outcomes
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 2, background: color.accent }} /> median path
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={color.borderSub} vertical={false} />
                  <XAxis
                    dataKey="months" stroke={color.textLo} tickLine={false} axisLine={false}
                    tickFormatter={(m) => `${m}m`} fontSize={12}
                  />
                  <YAxis
                    stroke={color.textLo} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => `${Math.round(v * 100)}%`} fontSize={12} width={48}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    dataKey="band90" stroke="none" fill={color.accent} fillOpacity={0.14} isAnimationActive={false}
                  />
                  <Area
                    dataKey="band50" stroke="none" fill={color.accent} fillOpacity={0.28} isAnimationActive={false}
                  />
                  <Line
                    dataKey="p50" stroke={color.accent} strokeWidth={2.5} dot={false} isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </section>

            <div style={{
              display: 'flex', gap: space.md, padding: space.md, borderRadius: radius.md,
              border: `1px solid ${color.borderSub}`, background: tint(color.accent, 5),
            }}>
              <Info size={16} aria-hidden strokeWidth={1.75} style={{ color: color.accent, flexShrink: 0, marginTop: 2 }} />
              <div style={{ color: color.textMid, fontSize: t.support - 1, lineHeight: 1.55 }}>
                {forecast.paths_simulated.toLocaleString('en-US')} simulated paths, resampled from{' '}
                {forecast.observations} days of this portfolio's own simulated history so that days when its
                assets moved together stay together in the sample.
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {forecast.assumptions.map((a) => <li key={a}>{a}</li>)}
                </ul>
                <div style={{ marginTop: 6, color: color.textLo }}>{data.disclaimer}</div>
              </div>
            </div>
          </>
        );
      })()}

      <StepFooter onBack={onBack} onContinue={onContinue} />
    </div>
  );
}
