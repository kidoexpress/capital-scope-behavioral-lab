import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Play, ShieldQuestion, Sparkles } from 'lucide-react';
import {
  assetLabel,
  fetchTemplates,
  runSimulation,
  type PersonaTemplate,
  type ScenarioTemplate,
  type Suggestion,
} from '../services/syntheticPortfolioApi';

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const signed = (x: number, d = 1) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(d)}%`;

const card: React.CSSProperties = {
  background: 'var(--surface, rgba(255,255,255,0.03))',
  border: '1px solid var(--border-sub, rgba(255,255,255,0.08))',
  borderRadius: 12,
  padding: 16,
};

function MetricTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-lo)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      {hint && <div style={{ fontSize: 10, color: 'var(--text-lo)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function AllocBar({ asset, weight }: { asset: string; weight: number }) {
  const isCash = asset === 'CASH';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: 64, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: isCash ? 'var(--text-lo)' : 'inherit' }}>
        {assetLabel(asset)}
      </div>
      <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, weight * 100)}%`, height: '100%', background: isCash ? 'var(--text-lo)' : 'var(--accent)', borderRadius: 99 }} />
      </div>
      <div style={{ width: 52, textAlign: 'right', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{pct(weight)}</div>
    </div>
  );
}

export default function SyntheticPortfolioLab() {
  const [personas, setPersonas] = useState<PersonaTemplate[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>([]);
  const [persona, setPersona] = useState<string>('');
  const [selScenarios, setSelScenarios] = useState<Set<string>>(new Set());
  const [seed, setSeed] = useState(42);
  const [useMemory, setUseMemory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [meta, setMeta] = useState<{ accuracy: number; random: number } | null>(null);

  useEffect(() => {
    fetchTemplates()
      .then((t) => {
        setPersonas(t.personas);
        setScenarios(t.scenarios);
        setPersona(t.personas[0]?.key ?? '');
        setSelScenarios(new Set(t.scenarios.map((s) => s.key)));
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const topAlloc = useMemo(
    () => (suggestion ? suggestion.allocation.filter((a) => a.weight > 0.001) : []),
    [suggestion],
  );

  async function run() {
    if (!persona) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation({
        seed,
        persona_keys: [persona],
        scenario_keys: Array.from(selScenarios),
        use_memory: useMemory,
      });
      setSuggestion(res.suggestions[0] ?? null);
      setMeta({
        accuracy: res.behavioral_separation.classification_accuracy,
        random: res.behavioral_separation.random_baseline,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  }

  function toggleScenario(key: string) {
    setSelScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const m = suggestion?.estimated_metrics;
  const v = suggestion?.versus_equal_weight;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Sparkles size={20} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Synthetic Portfolio Lab</h1>
      </div>
      <p style={{ color: 'var(--text-lo)', fontSize: 13, marginBottom: 16 }}>
        Simulate how a synthetic investor profile would build a portfolio across probabilistic market
        scenarios. Results are <strong>simulated hypotheses</strong>, not financial advice.
      </p>

      {/* ── Controls ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-lo)', marginBottom: 8 }}>
          1 · Investor profile (persona)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {personas.map((p) => (
            <button
              key={p.key}
              onClick={() => setPersona(p.key)}
              style={{
                padding: '6px 12px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                border: persona === p.key ? '1px solid var(--accent)' : '1px solid var(--border-sub)',
                background: persona === p.key ? 'var(--accent-dim, rgba(99,102,241,0.15))' : 'transparent',
                color: persona === p.key ? 'var(--accent)' : 'var(--text-lo)',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-lo)', marginBottom: 8 }}>
          2 · Scenarios to test ({selScenarios.size} selected)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {scenarios.map((s) => {
            const on = selScenarios.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleScenario(s.key)}
                title={s.regime}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                  border: on ? '1px solid var(--accent)' : '1px solid var(--border-sub)',
                  background: on ? 'var(--accent-dim, rgba(99,102,241,0.12))' : 'transparent',
                  color: on ? 'var(--accent)' : 'var(--text-lo)',
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            Seed
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-sub)', background: 'transparent', color: 'inherit', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </label>
          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={useMemory} onChange={(e) => setUseMemory(e.target.checked)} />
            Use persona memory
          </label>
          <button
            onClick={run}
            disabled={loading || !persona || selScenarios.size === 0}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: '1px solid var(--accent)', background: 'var(--accent)', color: '#fff',
              opacity: loading || !persona || selScenarios.size === 0 ? 0.5 : 1,
            }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Run simulation
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...card, borderColor: 'rgba(239,68,68,0.5)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <AlertTriangle size={16} style={{ color: '#ef4444' }} />
          <span style={{ fontSize: 13 }}>{error}. Make sure the backend is running on port 8100.</span>
        </div>
      )}

      {/* ── Suggestion ── */}
      {suggestion && m && v && (
        <>
          <div style={{ ...card, marginBottom: 16, borderColor: 'var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Simulated suggestion</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{suggestion.headline}</div>
                <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 2 }}>
                  Objective: {suggestion.objective.primary.replace(/_/g, ' ')} · {suggestion.objective.secondary.replace(/_/g, ' ')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text-lo)', textTransform: 'uppercase' }}>Behavioral Fit</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {suggestion.fit_score.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <MetricTile label="Est. scenario return" value={signed(m.expected_scenario_return)} hint="probability-weighted" />
            <MetricTile label="Est. volatility" value={pct(m.volatility)} />
            <MetricTile label="Est. drawdown" value={pct(m.expected_drawdown)} hint="worst scenario" />
            <MetricTile label="Scenario survival" value={pct(m.scenario_survival_rate, 0)} hint="within risk limit" />
            <MetricTile label="Liquidity" value={pct(m.liquidity_score, 0)} />
            <MetricTile label="VaR 95 (daily)" value={pct(m.var_95)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginBottom: 16 }}>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Suggested allocation</div>
              {topAlloc.map((a) => <AllocBar key={a.asset} asset={a.asset} weight={a.weight} />)}
            </div>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Why this allocation</div>
              <ul style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-mid, rgba(255,255,255,0.75))', paddingLeft: 16, margin: 0 }}>
                {suggestion.why.map((w, i) => <li key={i} style={{ marginBottom: 6 }}>{w}</li>)}
              </ul>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-sub)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-lo)' }}>vs. equal-weight baseline: </span>
                volatility {signed(v.volatility_delta)}, drawdown {signed(v.max_drawdown_delta)}, return {signed(v.annualized_return_delta)}
              </div>
            </div>
          </div>

          {/* Behavioral decisions per scenario */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>How the profile reacted per scenario</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {suggestion.scenario_decisions.map((d) => (
                <div key={d.scenario_id} style={{ border: '1px solid var(--border-sub)', borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-lo)' }}>{d.scenario_id.replace('scenario_', '')} · p={d.probability.toFixed(2)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{d.action.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 2 }}>
                    equity {signed(d.equity_delta)}{d.request_human_review ? ' · asks advisor' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining risks + separation */}
          {(suggestion.remaining_risks.length > 0 || meta) && (
            <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <ShieldQuestion size={16} style={{ color: 'var(--text-lo)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12.5 }}>
                {suggestion.remaining_risks.length > 0 ? (
                  <div><strong>Remaining risks:</strong> {suggestion.remaining_risks.join('; ')}</div>
                ) : (
                  <div><strong>Remaining risks:</strong> none flagged for this scenario set (still a simulation).</div>
                )}
                {meta && meta.random < 0.999 && (
                  <div style={{ color: 'var(--text-lo)', marginTop: 4 }}>
                    Behavioral separation vs other personas: {meta.accuracy.toFixed(2)} classification accuracy
                    (random baseline {meta.random.toFixed(2)}).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ ...card, borderColor: 'rgba(234,179,8,0.4)', background: 'rgba(234,179,8,0.06)', fontSize: 11.5, color: 'var(--text-mid, rgba(255,255,255,0.7))', display: 'flex', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
            <span>{suggestion.disclaimer}</span>
          </div>
        </>
      )}

      {!suggestion && !error && (
        <div style={{ ...card, textAlign: 'center', color: 'var(--text-lo)', fontSize: 13, padding: 40 }}>
          Pick an investor profile and scenarios, then run the simulation.
        </div>
      )}
    </div>
  );
}
