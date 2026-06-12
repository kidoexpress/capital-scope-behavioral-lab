import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Edit3, Plus, RefreshCw, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { usePortfolioStore, getTotalGainLoss, getTotalValue } from '../store/portfolioStore';
import { getStockQuote } from '../utils/api';
import { calcDiversificationScore, formatCurrency, formatPercent } from '../utils/finance';
import AllocationChart from '../components/charts/AllocationChart';
import Disclaimer from '../components/ui/Disclaimer';
import StockSearch from '../components/ui/StockSearch';
import EarningsCalendar from '../components/widgets/EarningsCalendar';
import RebalancingAdvisor from '../components/widgets/RebalancingAdvisor';
import { SECTOR_COLORS } from '../data/mockStocks';
import { DATA_SOURCE_LABEL } from '../services/marketDataService';
import type { PortfolioHolding } from '../types';

interface AddHoldingForm {
  symbol: string;
  shares: number;
  avgCost: number;
  weight: number;
}

function buildPerformanceData(holdings: PortfolioHolding[]) {
  const totalReturn = holdings.reduce((sum, holding) => sum + holding.weight * holding.gainLossPercent, 0);
  const volatility = Math.max(0.8, holdings.reduce((sum, holding) => sum + holding.weight, 0));
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return labels.map((month, index) => {
    const progress = index / (labels.length - 1);
    const curve = Math.sin(progress * Math.PI * 2) * volatility * 0.9;
    const portfolio = 100000 * (1 + ((totalReturn * progress + curve) / 100));
    const sp500 = 100000 * (1 + ((8.4 * progress + Math.sin(progress * Math.PI * 1.7) * 1.2) / 100));
    return {
      month,
      portfolio: Math.round(portfolio),
      benchmark: Math.round(sp500),
    };
  });
}

function buildRiskContribution(holdings: PortfolioHolding[]) {
  const raw = holdings.map(holding => {
    const beta = 1;
    return {
      symbol: holding.symbol,
      contribution: holding.weight * beta,
    };
  });
  const total = raw.reduce((sum, item) => sum + item.contribution, 0) || 1;
  return raw.map(item => ({
    ...item,
    contribution: Number((item.contribution / total * 100).toFixed(1)),
  }));
}

function PortfolioReviewCard({ holdings, diversScore }: { holdings: PortfolioHolding[]; diversScore: number }) {
  const topHolding = holdings.reduce((max, holding) => holding.weight > max.weight ? holding : max, holdings[0]);
  const strongest = holdings.reduce((best, holding) => holding.gainLossPercent > best.gainLossPercent ? holding : best, holdings[0]);
  const weakest = holdings.reduce((worst, holding) => holding.gainLossPercent < worst.gainLossPercent ? holding : worst, holdings[0]);
  const techWeight = holdings.filter(h => h.sector === 'Technology').reduce((sum, h) => sum + h.weight, 0);
  const tone = diversScore >= 70 ? 'Balanced' : diversScore >= 45 ? 'Selective concentration' : 'Concentrated';

  return (
    <section className="workflow-card portfolio-review-card">
      <div className="workflow-card-header">
        <div>
          <span className="label-upper">AI Portfolio Review</span>
          <h2>{tone}</h2>
        </div>
      </div>
      <div className="portfolio-review-grid">
        <div>
          <span>Key concentration risk</span>
          <strong>{topHolding?.symbol ?? 'N/A'} at {((topHolding?.weight ?? 0) * 100).toFixed(0)}%</strong>
          <p>{techWeight > 0.5 ? `Technology represents ${(techWeight * 100).toFixed(0)}% of the portfolio.` : 'Sector exposure appears more balanced than a single-sector portfolio.'}</p>
        </div>
        <div>
          <span>Strongest holding</span>
          <strong>{strongest?.symbol ?? 'N/A'}</strong>
          <p>{formatPercent(strongest?.gainLossPercent ?? 0)} unrealized performance.</p>
        </div>
        <div>
          <span>Weakest holding</span>
          <strong>{weakest?.symbol ?? 'N/A'}</strong>
          <p>{formatPercent(weakest?.gainLossPercent ?? 0)} unrealized performance.</p>
        </div>
      </div>
      <div className="watch-items">
        <span className="label-upper">Suggested Watch Items</span>
        <ul>
          <li>Single-name weights above 30% and their earnings dates.</li>
          <li>Sector drawdown sensitivity versus the S&P 500.</li>
          <li>Whether gains are driven by one position or broad contribution.</li>
        </ul>
      </div>
      <p className="workflow-footnote">Educational analysis only. Not financial advice. Verify all data independently before making investment decisions.</p>
    </section>
  );
}

export default function PortfolioBuilder() {
  const { holdings, addHolding, removeHolding, updateWeight, normalizeWeights } = usePortfolioStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<AddHoldingForm>({ symbol: '', shares: 10, avgCost: 100, weight: 0.1 });
  const [addLoading, setAddLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'stock' | 'sector'>('stock');

  const totalValue = getTotalValue(holdings);
  const { amount: totalGL, percent: totalGLPct } = getTotalGainLoss(holdings);
  const diversScore = calcDiversificationScore(
    holdings.map(h => h.weight),
    holdings.map(() => holdings.map(() => 0.5)),
    holdings.map(h => h.sector)
  );

  const performanceData = useMemo(() => buildPerformanceData(holdings), [holdings]);
  const riskContribution = useMemo(() => buildRiskContribution(holdings), [holdings]);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    if (holdings.length === 0) return;
    let cancelled = false;
    void Promise.all(holdings.map(async holding => {
      const quote = await getStockQuote(holding.symbol);
      if (!cancelled && quote) {
        usePortfolioStore.getState().updateHoldingPrice(holding.symbol, quote.price);
      }
    }));
    return () => { cancelled = true; };
  }, [holdings.map(h => h.symbol).join(',')]);

  const handleAdd = async () => {
    if (!form.symbol) return;
    setAddLoading(true);
    const quote = await getStockQuote(form.symbol);
    if (!quote) {
      setAddLoading(false);
      return;
    }
    const price = quote.price;
    addHolding({
      symbol: form.symbol,
      name: quote.name,
      weight: form.weight,
      shares: form.shares,
      avgCost: form.avgCost,
      currentPrice: price,
      sector: quote.sector || 'Unknown',
    });
    setForm({ symbol: '', shares: 10, avgCost: 100, weight: 0.1 });
    setAddLoading(false);
  };

  return (
    <div className="workflow-page portfolio-page animate-fade-in-up">
      <div className="product-page-heading">
        <div>
          <p>Portfolio</p>
          <h1>Portfolio Intelligence</h1>
        </div>
        <span>A cleaner operating view for allocation, performance, concentration, and risk contribution. {DATA_SOURCE_LABEL} for current prices.</span>
      </div>

      <section className="portfolio-kpi-grid">
        <div className="portfolio-kpi primary">
          <span>Total Portfolio Value</span>
          <strong>{formatCurrency(totalValue)}</strong>
          <em className={totalGL >= 0 ? 'positive' : 'negative'}>
            {totalGL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {formatCurrency(totalGL)} ({formatPercent(totalGLPct)})
          </em>
        </div>
        <div className="portfolio-kpi">
          <span>Total Gain/Loss</span>
          <strong className={totalGL >= 0 ? 'positive' : 'negative'}>{formatPercent(totalGLPct)}</strong>
          <em>{formatCurrency(totalGL)}</em>
        </div>
        <div className="portfolio-kpi">
          <span>Diversification Score</span>
          <strong>{diversScore}<small>/100</small></strong>
          <div className="mini-score-bar"><i style={{ width: `${diversScore}%` }} /></div>
        </div>
        <div className="portfolio-kpi">
          <span>Holdings</span>
          <strong>{holdings.length}</strong>
          <em>{new Set(holdings.map(h => h.sector)).size} sectors</em>
        </div>
      </section>

      <section className="portfolio-main-grid">
        <div className="workflow-card portfolio-performance-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Performance</span>
              <h2>Portfolio vs S&P 500</h2>
            </div>
            <button onClick={() => setDrawerOpen(true)} className="secondary-action"><Edit3 size={14} /> Edit Holdings</button>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="portfolioArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#55d99a" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#55d99a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
              <Tooltip
                content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="cs-tooltip">
                    <strong>{label}</strong>
                    {payload.map(item => (
                      <div key={item.dataKey as string}>{item.name}: {formatCurrency(Number(item.value))}</div>
                    ))}
                  </div>
                ) : null}
              />
              <Area type="monotone" dataKey="portfolio" name="Portfolio" stroke="#55d99a" fill="url(#portfolioArea)" strokeWidth={2} />
              <Area type="monotone" dataKey="benchmark" name="S&P 500" stroke="rgba(255,255,255,0.38)" fill="transparent" strokeWidth={2} strokeDasharray="4 5" />
            </AreaChart>
          </ResponsiveContainer>
          {/* Disclaimer — chart uses illustrative simulated returns, not real historical data */}
          <p style={{ fontSize: 10, color: 'var(--text-lo)', marginTop: 8, textAlign: 'center' }}>
            Illustrative only — returns are simulated, not based on actual historical prices
          </p>
        </div>

        <div className="workflow-card allocation-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Allocation</span>
              <h2>Exposure</h2>
            </div>
            <div className="segmented-control small">
              {(['stock', 'sector'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={viewMode === mode ? 'active' : ''}>{mode}</button>
              ))}
            </div>
          </div>
          <AllocationChart holdings={holdings} type={viewMode} size={260} />
        </div>
      </section>

      <section className="portfolio-bottom-grid">
        <div className="workflow-card holdings-card">
          <div className="workflow-card-header">
            <div>
              <span className="label-upper">Holdings</span>
              <h2>Current Positions</h2>
            </div>
            <button onClick={() => setDrawerOpen(true)} className="secondary-action"><Edit3 size={14} /> Edit Holdings</button>
          </div>
          <div className="clean-table-wrap">
            <table className="clean-holdings-table">
              <thead>
                <tr>
                  <th>Holding</th>
                  <th>Shares</th>
                  <th>Current</th>
                  <th>Value</th>
                  <th>P/L</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(holding => (
                  <tr key={holding.symbol}>
                    <td>
                      <div className="holding-identity">
                        <i style={{ background: SECTOR_COLORS[holding.sector] || '#8aa4ff' }} />
                        <div>
                          <strong>{holding.symbol}</strong>
                          <span>{holding.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>{holding.shares}</td>
                    <td>{formatCurrency(holding.currentPrice)}</td>
                    <td>{formatCurrency(holding.value)}</td>
                    <td>
                      <strong className={holding.gainLoss >= 0 ? 'positive' : 'negative'}>{formatPercent(holding.gainLossPercent)}</strong>
                      <span>{formatCurrency(holding.gainLoss)}</span>
                    </td>
                    <td>
                      <div className="readable-weight">
                        <i style={{ width: `${holding.weight * 100}%` }} />
                        <span>{(holding.weight * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="side-stack">
          <div className="workflow-card risk-contribution-card">
            <div className="workflow-card-header">
              <div>
                <span className="label-upper">Risk Contribution</span>
                <h2>By Holding</h2>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={riskContribution} layout="vertical" margin={{ left: 6, right: 14 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="symbol" axisLine={false} tickLine={false} width={42} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="cs-tooltip">
                      <strong>{label}</strong>
                      <div>{payload[0].value}% estimated contribution</div>
                    </div>
                  ) : null}
                />
                <Bar dataKey="contribution" fill="#8aa4ff" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {holdings.length > 0 && <PortfolioReviewCard holdings={holdings} diversScore={diversScore} />}
          {holdings.length > 0 && (
            <EarningsCalendar symbols={holdings.map(h => h.symbol)} />
          )}
          {holdings.length > 0 && totalValue > 0 && (
            <RebalancingAdvisor
              holdings={holdings.map(h => ({ symbol: h.symbol, currentWeight: h.weight * 100, currentValue: h.value }))}
              totalValue={totalValue}
            />
          )}
          <Disclaimer />
        </div>
      </section>

      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside className="edit-holdings-drawer" onClick={event => event.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="label-upper">Edit Holdings</span>
                <h2>Portfolio Inputs</h2>
              </div>
              <button onClick={() => setDrawerOpen(false)}><X size={18} /></button>
            </div>

            <div className="drawer-add-card">
              <StockSearch
                onSelect={sym => setForm(f => ({ ...f, symbol: sym }))}
                placeholder="Search ticker..."
              />
              <div className="drawer-form-grid">
                <label>Shares<input type="number" value={form.shares} min={1} onChange={e => setForm(f => ({ ...f, shares: Number(e.target.value) }))} /></label>
                <label>Avg cost<input type="number" value={form.avgCost} min={0.01} step={0.01} onChange={e => setForm(f => ({ ...f, avgCost: Number(e.target.value) }))} /></label>
                <label>Weight %<input type="number" value={(form.weight * 100).toFixed(0)} min={0} max={100} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) / 100 }))} /></label>
              </div>
              <button onClick={handleAdd} disabled={!form.symbol || addLoading} className="workflow-primary-action">
                <Plus size={16} /> {addLoading ? 'Adding...' : `Add ${form.symbol || 'Holding'}`}
              </button>
            </div>

            <div className="drawer-holdings-list">
              {holdings.map(holding => (
                <div key={holding.symbol} className="drawer-holding-row">
                  <div>
                    <strong>{holding.symbol}</strong>
                    <span>{holding.sector}</span>
                  </div>
                  <label>
                    Weight
                    <input type="number" value={(holding.weight * 100).toFixed(0)} min={0} max={100} onChange={e => updateWeight(holding.symbol, Number(e.target.value) / 100)} />
                  </label>
                  <button onClick={() => removeHolding(holding.symbol)}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>

            <button onClick={normalizeWeights} className="drawer-secondary-action"><RefreshCw size={15} /> Normalize Weights</button>
          </aside>
        </div>
      )}
    </div>
  );
}
