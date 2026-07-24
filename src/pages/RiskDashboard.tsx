import { useEffect, useState, type ReactNode } from 'react';
import { fetchPriceHistory } from '../utils/priceHistory';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, BarChart2, CircleHelp, Gauge, Layers3, Shield, TrendingDown } from 'lucide-react';
import CorrelationMatrix from '../components/charts/CorrelationMatrix';
import { SECTOR_COLORS, STOCK_DATABASE } from '../data/mockStocks';
import { usePortfolioStore } from '../store/portfolioStore';
import { calcDiversificationScore, formatCurrency } from '../utils/finance';
import { DATA_SOURCE_LABEL, getQuote } from '../services/marketDataService';

const VAR_CONFIDENCE = [
  { label: '90% confidence', confidence: 0.90, z: 1.28, plain: 'One in ten trading days could exceed this move.' },
  { label: '95% confidence', confidence: 0.95, z: 1.645, plain: 'One in twenty trading days could exceed this move.' },
  { label: '99% confidence', confidence: 0.99, z: 2.326, plain: 'A rare stress day could exceed this estimate.' },
];

function calcVaR(portfolioValue: number, volatility: number, z: number): number {
  return portfolioValue * volatility * z * Math.sqrt(1 / 252);
}

function riskTone(score: number) {
  if (score >= 72) return 'Calm';
  if (score >= 50) return 'Balanced';
  if (score >= 30) return 'Elevated';
  return 'Fragile';
}

function RiskMetricCard({
  icon,
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  return (
    <div className={`risk-metric-card ${tone}`}>
      <div className="risk-card-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

export default function RiskDashboard() {
  const navigate = useNavigate();
  const { holdings } = usePortfolioStore();
  const holdingSymbols = holdings.map(h => h.symbol).join(',');
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const hasHoldings = holdings.length > 0;
  const hasCorrelationData = holdings.length >= 2;

  useEffect(() => {
    if (!holdings.length) return;
    let cancelled = false;
    void Promise.all(holdings.map(async holding => {
      const quote = await getQuote(holding.symbol);
      if (!cancelled && quote) {
        usePortfolioStore.getState().updateHoldingPrice(holding.symbol, quote.price);
      }
    }));
    return () => { cancelled = true; };
  }, [holdingSymbols]);

  const sectorMap = holdings.reduce<Record<string, number>>((map, holding) => {
    map[holding.sector] = (map[holding.sector] || 0) + holding.weight;
    return map;
  }, {});

  const topSectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxConcentration = holdings.reduce((max, h) => Math.max(max, h.weight), 0);
  const topHolding = [...holdings].sort((a, b) => b.weight - a.weight)[0];
  const topSector = topSectors[0];
  const hhi = holdings.reduce((sum, h) => sum + h.weight * h.weight, 0);
  // FIX: estimate portfolio volatility from beta-weighted holdings.
  // Using beta × market vol (15% annual) as a proxy — much better than a fixed constant.
  const MARKET_VOL = 0.15;
  const estVol = holdings.length > 0
    ? Math.max(
        0.05,
        holdings.reduce((sum, h) => {
          const beta = STOCK_DATABASE[h.symbol]?.beta ?? 1.0;
          return sum + h.weight * beta * MARKET_VOL;
        }, 0)
      )
    : MARKET_VOL;
  const diversScore = calcDiversificationScore(
    holdings.map(h => h.weight),
    holdings.map(() => holdings.map(() => 0.5)),
    holdings.map(h => h.sector)
  );
  const estimatedDrawdown = hasHoldings ? -Math.min(65, Math.max(8, estVol * 100 * 1.8 + maxConcentration * 22)) : 0;
  const riskScore = hasHoldings
    ? Math.max(0, Math.min(100, Math.round(diversScore - hhi * 18 - Math.max(0, maxConcentration - 0.25) * 65)))
    : 0;
  const tone = riskTone(riskScore);
  const symbols = holdings.map(h => h.symbol);
  const oneDayVaR95 = hasHoldings ? calcVaR(totalValue, estVol, 1.645) : 0;

  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  useEffect(() => {
    if (symbols.length < 2) return;
    fetchPriceHistory(symbols).then(setPriceHistory);
  }, [symbols.join(',')]);

  return (
    <div className="risk-intelligence-page animate-fade-in-up">
      <section className="risk-hero">
        <div>
          <span className="section-kicker">Risk Management</span>
          <h1>Risk Intelligence</h1>
          <p>Understand concentration, volatility, drawdown, and exposure before they hurt returns.</p>
        </div>
        <div className="risk-source-pill">
          <span className="pulse-live" />
          {DATA_SOURCE_LABEL}
        </div>
      </section>

      {!hasCorrelationData && (
        <section className="risk-empty-callout">
          <div className="risk-empty-icon"><Layers3 size={22} /></div>
          <div>
            <strong>Add at least 2 holdings to calculate correlation and portfolio risk.</strong>
            <span>Capital Scope Behavioral Lab can still show basic exposure, but institutional portfolio risk needs multiple positions.</span>
          </div>
          <button onClick={() => navigate('/portfolio')}>
            Open Portfolio Builder <ArrowRight size={15} />
          </button>
        </section>
      )}

      <section className="risk-metric-grid">
        <RiskMetricCard
          icon={<Gauge size={18} />}
          label="Portfolio Risk Score"
          value={hasHoldings ? `${riskScore}/100` : '—'}
          detail={hasHoldings ? `${tone} risk tone based on concentration and diversification.` : 'Add holdings to activate scoring.'}
          tone={riskScore >= 65 ? 'good' : riskScore >= 42 ? 'warn' : hasHoldings ? 'bad' : 'neutral'}
        />
        <RiskMetricCard
          icon={<Layers3 size={18} />}
          label="Diversification"
          value={hasHoldings ? `${diversScore}/100` : '—'}
          detail={hasHoldings ? `${Object.keys(sectorMap).length} sectors represented.` : 'No portfolio allocation yet.'}
          tone={diversScore >= 65 ? 'good' : diversScore >= 40 ? 'warn' : hasHoldings ? 'bad' : 'neutral'}
        />
        <RiskMetricCard
          icon={<TrendingDown size={18} />}
          label="Max Drawdown"
          value={hasHoldings ? `${estimatedDrawdown.toFixed(1)}%` : '—'}
          detail="Estimated stress drawdown from volatility and concentration."
          tone={estimatedDrawdown > -18 ? 'good' : estimatedDrawdown > -32 ? 'warn' : 'bad'}
        />
        <RiskMetricCard
          icon={<Shield size={18} />}
          label="Value at Risk"
          value={hasHoldings ? `-${formatCurrency(oneDayVaR95, 0)}` : '—'}
          detail="95% one-day VaR using a normal approximation."
          tone={hasHoldings ? 'warn' : 'neutral'}
        />
      </section>

      <section className="risk-content-grid">
        <div className="risk-main-stack">
          <div className="risk-panel">
            <div className="risk-panel-header">
              <div>
                <span className="section-kicker">Correlation</span>
                <h2>Cross-Holding Sensitivity</h2>
              </div>
              <CircleHelp size={16} aria-label="Correlation estimates how similarly holdings move." />
            </div>
            {hasCorrelationData ? (
              <div className="risk-correlation-wrap">
                <CorrelationMatrix symbols={symbols} prices={priceHistory} />
              </div>
            ) : (
              <div className="risk-placeholder-card">
                <Activity size={20} />
                <strong>Correlation needs more positions.</strong>
                <span>Add a second holding to reveal relationship risk across your portfolio.</span>
              </div>
            )}
          </div>

          <div className="risk-panel">
            <div className="risk-panel-header">
              <div>
                <span className="section-kicker">Exposure</span>
                <h2>Sector Concentration</h2>
              </div>
              <BarChart2 size={17} />
            </div>
            {topSectors.length ? (
              <div className="sector-exposure-list">
                {topSectors.map(([sector, weight]) => (
                  <div className="sector-exposure-row" key={sector}>
                    <div>
                      <span>{sector}</span>
                      <strong>{(weight * 100).toFixed(0)}%</strong>
                    </div>
                    <div className="sector-track">
                      <i style={{ width: `${Math.min(100, weight * 100)}%`, background: SECTOR_COLORS[sector] || 'var(--accent)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="risk-placeholder-card compact">
                <strong>No sector exposure yet.</strong>
                <span>Add holdings to see the top sector risks.</span>
              </div>
            )}
          </div>

          <div className="var-card-row">
            {VAR_CONFIDENCE.map(item => {
              const daily = hasHoldings ? calcVaR(totalValue, estVol, item.z) : 0;
              return (
                <div className="var-confidence-card" key={item.confidence}>
                  <span>{item.label}</span>
                  <strong>{hasHoldings ? `-${formatCurrency(daily, 0)}` : '—'}</strong>
                  <div>
                    <em>1-week: {hasHoldings ? `-${formatCurrency(daily * Math.sqrt(5), 0)}` : '—'}</em>
                    <p>{item.plain}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="risk-memo-card">
          <span className="section-kicker">AI Risk Analysis</span>
          <h2>Executive Risk Memo</h2>
          <div className="memo-tone">
            <span>Overall risk tone</span>
            <strong>{hasHoldings ? tone : 'Not enough data'}</strong>
          </div>
          <div className="memo-section">
            <span>Biggest risk</span>
            <p>{topHolding ? `${topHolding.symbol} is the largest single position at ${(topHolding.weight * 100).toFixed(0)}% of portfolio value.` : 'No holdings have been added yet.'}</p>
          </div>
          <div className="memo-section">
            <span>Diversification note</span>
            <p>{hasCorrelationData ? `The portfolio spans ${Object.keys(sectorMap).length} sectors with a diversification score of ${diversScore}/100.` : 'Correlation and diversification quality need at least two holdings.'}</p>
          </div>
          <div className="memo-section">
            <span>Concentration warning</span>
            <p>{topSector ? `${topSector[0]} is the largest sector exposure at ${(topSector[1] * 100).toFixed(0)}%. Monitor sector-specific shocks and earnings correlation.` : 'Sector concentration will appear after holdings are added.'}</p>
          </div>
          <div className="memo-section">
            <span>What to monitor next</span>
            <p>Track position weights, sector overlap, portfolio volatility, and whether new additions actually reduce correlated downside.</p>
          </div>
          <div className="risk-disclaimer">Educational analysis only. Not financial advice.</div>
        </aside>
      </section>
    </div>
  );
}
