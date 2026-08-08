import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  AlertTriangle, ArrowUpRight, Building2, Copy, ExternalLink, Landmark, Loader2,
} from 'lucide-react';
import {
  fetchCatalog, fetchCongressActivity, fetchPortfolio, fetchReplicationPlan,
  formatPct, formatUsdCompact, formatWeight,
  type CongressActivity, type PortfolioDetail, type PortfolioProfile, type ReplicationPlan,
} from '../services/publicPortfoliosApi';

const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

const card: CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-sub)',
  borderRadius: 20,
  padding: 22,
};
const eyebrow: CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.10em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.36)',
};
const rowBetween: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 };

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  const color = tone === 'pos' ? 'var(--green)' : tone === 'neg' ? 'var(--red)' : 'var(--text-hi)';
  return (
    <div style={{ ...card, padding: 14, borderRadius: 14 }}>
      <div style={{ ...eyebrow, fontSize: 10 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 5, color, fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
    </div>
  );
}

export default function PublicPortfolios() {
  const [profiles, setProfiles] = useState<PortfolioProfile[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [detail, setDetail] = useState<PortfolioDetail | null>(null);
  const [plan, setPlan] = useState<ReplicationPlan | null>(null);
  const [congress, setCongress] = useState<CongressActivity | null>(null);
  const [tab, setTab] = useState<'funds' | 'congress'>('funds');
  const [capital, setCapital] = useState(100000);
  const [error, setError] = useState<string | null>(null);

  // Derived rather than stored, so no state is set synchronously inside an effect.
  const detailMatchesSelection = detail?.profile.slug === slug;
  const loading = Boolean(slug) && !detailMatchesSelection && !error;
  const activePlan = plan?.slug === slug ? plan : null;

  useEffect(() => {
    fetchCatalog()
      .then((c) => { setProfiles(c.portfolios); setSlug(c.portfolios[0]?.slug ?? ''); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchPortfolio(slug)
      .then((d) => { if (!cancelled) { setDetail(d); setError(null); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setDetail(null); } });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (tab === 'congress' && !congress) {
      fetchCongressActivity(25).then(setCongress).catch((e) => setError(e.message));
    }
  }, [tab, congress]);

  const summary = detail?.profile.executive_summary;
  const perf = detail?.performance;
  const topHoldings = useMemo(() => (detail?.holdings ?? []).slice(0, 12), [detail]);

  const buildPlan = () => {
    if (!slug) return;
    fetchReplicationPlan(slug, capital, 10).then(setPlan).catch((e) => setError(e.message));
  };

  return (
    <div className="workflow-page animate-fade-in-up" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 28px 80px' }}>
      {/* header */}
      <div style={{ marginBottom: 22 }}>
        <span style={eyebrow}>Public Portfolio Tracker</span>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: '6px 0 8px', color: 'var(--text-hi)' }}>
          Follow the disclosed books
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-mid)', maxWidth: 680, lineHeight: 1.6 }}>
          Real holdings from SEC 13F filings and official US House trade disclosures — with each
          manager's strategy summarised, measured against the S&amp;P 500, and convertible into a
          paper-trading plan.
        </p>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {([['funds', 'Institutions', Building2], ['congress', 'Politicians', Landmark]] as const).map(
          ([key, label, Icon]) => {
            const on = tab === key;
            return (
              <button key={key} type="button" onClick={() => setTab(key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                  borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border-sub)'}`,
                  background: on ? tint('var(--accent)', 12) : 'transparent',
                  color: on ? 'var(--accent)' : 'var(--text-mid)',
                }}>
                <Icon size={15} aria-hidden /> {label}
              </button>
            );
          })}
      </div>

      {error && (
        <div style={{ ...card, borderColor: tint('var(--red)', 45), display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
          <AlertTriangle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>{error} — make sure the backend is running on port 8100.</span>
        </div>
      )}

      {tab === 'funds' && (
        <>
          {/* manager selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
            {profiles.map((p) => {
              const on = p.slug === slug;
              return (
                <button key={p.slug} type="button" onClick={() => setSlug(p.slug)}
                  style={{
                    padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
                    fontWeight: on ? 700 : 500,
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border-sub)'}`,
                    background: on ? tint('var(--accent)', 12) : 'var(--bg-surface)',
                    color: on ? 'var(--accent)' : 'var(--text-mid)',
                  }}>
                  {p.name}
                </button>
              );
            })}
          </div>

          {loading && (
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-mid)' }}>
              <Loader2 size={16} className="animate-spin" /> Loading the latest filing…
            </div>
          )}

          {!loading && detail && summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
              {/* left column */}
              <div style={{ display: 'grid', gap: 20 }}>
                {/* executive summary */}
                <section style={card}>
                  <div style={rowBetween}>
                    <div>
                      <span style={eyebrow}>Executive summary</span>
                      <h2 style={{ fontSize: 21, fontWeight: 700, margin: '4px 0 2px', color: 'var(--text-hi)' }}>
                        {detail.profile.name}
                      </h2>
                      <p style={{ fontSize: 12.5, color: 'var(--text-lo)' }}>{detail.profile.manager}</p>
                    </div>
                    {detail.filing && (
                      <a href={detail.filing.source_url} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent)' }}>
                        SEC filing <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <p style={{ fontSize: 15, color: 'var(--text-hi)', margin: '14px 0 12px', lineHeight: 1.55, fontWeight: 500 }}>
                    {summary.headline}
                  </p>
                  <p style={{ fontSize: 13.5, color: 'var(--text-mid)', lineHeight: 1.65 }}>{summary.strategy}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '14px 0' }}>
                    {summary.style_tags.map((t) => (
                      <span key={t} style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 999,
                        background: 'var(--bg-raised)', border: '1px solid var(--border-sub)', color: 'var(--text-mid)',
                      }}>{t}</span>
                    ))}
                  </div>

                  <dl style={{ display: 'grid', gap: 10, margin: '16px 0 0', paddingTop: 14, borderTop: '1px solid var(--border-sub)' }}>
                    {[['Edge', summary.edge], ['Concentration', summary.concentration],
                      ['Turnover', summary.turnover], ['Copying it', summary.replication_note]].map(([k, v]) => (
                      <div key={k}>
                        <dt style={{ ...eyebrow, fontSize: 10, marginBottom: 3 }}>{k}</dt>
                        <dd style={{ fontSize: 13, color: 'var(--text-mid)', margin: 0, lineHeight: 1.55 }}>{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {summary.caveats.length > 0 && (
                    <ul style={{ margin: '14px 0 0', paddingLeft: 18, display: 'grid', gap: 5 }}>
                      {summary.caveats.map((c) => (
                        <li key={c} style={{ fontSize: 12.5, color: 'var(--text-lo)', lineHeight: 1.5 }}>{c}</li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* holdings */}
                <section style={card}>
                  <div style={rowBetween}>
                    <span style={eyebrow}>Disclosed holdings</span>
                    {detail.filing && (
                      <span style={{ fontSize: 11.5, color: 'var(--text-lo)' }}>
                        {detail.filing.positions} positions · {formatUsdCompact(detail.filing.total_value_usd)} · period {detail.filing.period}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 14, display: 'grid', gap: 7 }}>
                    {topHoldings.map((h) => (
                      <div key={h.cusip + h.issuer} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 58, fontSize: 12.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                          color: h.ticker ? 'var(--text-hi)' : 'var(--text-lo)',
                        }}>{h.ticker ?? '—'}</span>
                        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.issuer}
                        </span>
                        <div style={{ width: 110, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, h.weight * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
                        </div>
                        <span style={{ width: 52, textAlign: 'right', fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-hi)' }}>
                          {formatWeight(h.weight)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {detail.filing && detail.filing.unresolved_tickers > 0 && (
                    <p style={{ fontSize: 11.5, color: 'var(--text-lo)', marginTop: 12 }}>
                      {detail.filing.unresolved_tickers} position(s) could not be matched to a ticker and are shown as “—”.
                    </p>
                  )}
                </section>
              </div>

              {/* right column */}
              <div style={{ display: 'grid', gap: 20 }}>
                <section style={card}>
                  <span style={eyebrow}>Since the filing period</span>
                  {perf && perf.portfolio_return !== null ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                        <Stat label="Portfolio" value={formatPct(perf.portfolio_return)}
                          tone={(perf.portfolio_return ?? 0) >= 0 ? 'pos' : 'neg'} />
                        <Stat label="S&P 500" value={formatPct(perf.benchmark_return)} />
                        <Stat label="Excess" value={formatPct(perf.excess_return)}
                          tone={(perf.excess_return ?? 0) >= 0 ? 'pos' : 'neg'} />
                        <Stat label="Max drawdown" value={formatPct(perf.max_drawdown)} />
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-lo)', marginTop: 12, lineHeight: 1.5 }}>
                        {perf.start} → {perf.end} · {formatWeight(perf.coverage, 0)} of the book priced. {perf.note}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-lo)', marginTop: 10 }}>
                      {perf?.note ?? 'Performance could not be measured for this filing.'}
                    </p>
                  )}
                </section>

                {/* replication */}
                <section style={card}>
                  <span style={eyebrow}>Replicate this book</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-mid)' }}>Capital</label>
                    <input type="number" min={1000} step={1000} value={capital}
                      onChange={(e) => setCapital(Number(e.target.value))}
                      style={{
                        flex: 1, height: 36, padding: '0 10px', borderRadius: 10,
                        border: '1px solid var(--border-sub)', background: 'var(--bg-raised)',
                        color: 'var(--text-hi)', outline: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                      }} />
                  </div>
                  <button type="button" onClick={buildPlan}
                    style={{
                      width: '100%', height: 44, marginTop: 12, borderRadius: 999, border: 'none',
                      cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
                      background: 'rgba(255,255,255,0.92)', color: '#080a0f',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    <Copy size={15} /> Build allocation plan
                  </button>

                  {activePlan && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {activePlan.orders.map((o) => (
                          <div key={o.ticker} style={{ ...rowBetween, fontSize: 12.5 }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text-hi)' }}>{o.ticker}</span>
                            <span style={{ color: 'var(--text-lo)' }}>{formatWeight(o.target_weight)}</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-mid)' }}>
                              ${o.allocation_usd.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-lo)', marginTop: 12, lineHeight: 1.5 }}>
                        Top {activePlan.orders.length} names, renormalised to {formatWeight(activePlan.coverage, 0)} of the book
                        ({activePlan.excluded_positions} excluded). Enter these in Paper Trade to simulate the strategy.
                      </p>
                    </div>
                  )}
                </section>

                <div style={{
                  ...card, padding: 14, background: tint('var(--amber)', 6),
                  borderColor: tint('var(--amber)', 25), display: 'flex', gap: 9,
                }}>
                  <AlertTriangle size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1.55 }}>{detail.disclaimer}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'congress' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: 20, alignItems: 'start' }}>
          <section style={card}>
            <span style={eyebrow}>Filing activity</span>
            {congress ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  <Stat label="Trade filings" value={String(congress.summary.total_trade_filings)} />
                  <Stat label="Members" value={String(congress.summary.unique_members)} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <span style={{ ...eyebrow, fontSize: 10 }}>Most active in {congress.summary.year}</span>
                  <div style={{ marginTop: 10, display: 'grid', gap: 7 }}>
                    {congress.summary.most_active.slice(0, 8).map((m) => (
                      <div key={m.member} style={{ ...rowBetween, fontSize: 12.5 }}>
                        <span style={{ color: 'var(--text-mid)' }}>{m.member}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-hi)' }}>{m.filings}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-lo)', marginTop: 12 }}>Loading disclosures…</p>
            )}
          </section>

          <section style={card}>
            <span style={eyebrow}>Latest trade reports</span>
            <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
              {(congress?.recent ?? []).map((d) => (
                <a key={d.doc_id} href={d.pdf_url} target="_blank" rel="noreferrer"
                  style={{
                    ...rowBetween, padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
                    background: 'var(--bg-raised)', border: '1px solid var(--border-sub)',
                  }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>{d.member}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-lo)' }}>{d.state_district} · filed {d.filing_date}</div>
                  </div>
                  <ArrowUpRight size={15} style={{ color: 'var(--text-lo)', flexShrink: 0 }} />
                </a>
              ))}
            </div>
            {congress && (
              <p style={{ fontSize: 11.5, color: 'var(--text-lo)', marginTop: 14, lineHeight: 1.55 }}>
                {congress.summary.limitation} Open a filing to read the official PDF.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
