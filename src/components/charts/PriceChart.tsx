import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import type { TimeRange } from '../../types';
import { getStockHistory } from '../../utils/api';
import { calcSMA, calcRSI, calcMACD, calcBollingerBands } from '../../utils/technicalIndicators';

const TIME_RANGES: TimeRange[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y'];

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  compareSymbol?: string;
  height?: number;
}

interface OverlayState {
  sma20: boolean;
  sma50: boolean;
  bb: boolean;
  rsi: boolean;
  macd: boolean;
}

const OVERLAY_LABELS: { key: keyof OverlayState; label: string }[] = [
  { key: 'sma20', label: 'SMA 20' },
  { key: 'sma50', label: 'SMA 50' },
  { key: 'bb', label: 'Bollinger' },
  { key: 'rsi', label: 'RSI' },
  { key: 'macd', label: 'MACD' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="cs-tooltip">
      <p className="font-mono text-[10px] mb-2" style={{ color: 'var(--text-lo)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number'
            ? p.name?.includes('%') || p.dataKey === 'change' || p.dataKey === 'compareChange'
              ? `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}%`
              : `$${p.value.toFixed(2)}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function PriceChart({ symbol, currentPrice, compareSymbol, height = 360 }: PriceChartProps) {
  const [range, setRange] = useState<TimeRange>('1Y');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPositive, setIsPositive] = useState(true);
  const [overlays, setOverlays] = useState<OverlayState>({ sma20: false, sma50: false, bb: false, rsi: false, macd: false });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStockHistory(symbol, range, currentPrice),
      compareSymbol ? getStockHistory(compareSymbol, range) : Promise.resolve([]),
    ]).then(([history, compare]) => {
      if (history.length > 1) {
        setIsPositive(history[history.length - 1].close >= history[0].close);
      }
      const basePrice = history[0]?.close || currentPrice;
      const closes = history.map(p => p.close);
      const sma20 = calcSMA(closes, 20);
      const sma50 = calcSMA(closes, 50);
      const bb = calcBollingerBands(closes);
      const rsi = closes.length > 15 ? calcRSI(closes) : closes.map(() => null);
      const macd = closes.length > 35 ? calcMACD(closes) : { macd: closes.map(() => null), signal: closes.map(() => null), histogram: closes.map(() => null) };
      const normalized = history.map((p, i) => ({
        date:    p.date,
        price:   +p.close.toFixed(2),
        change:  +((p.close / basePrice - 1) * 100).toFixed(3),
        sma20:   sma20[i] != null ? +(sma20[i] as number).toFixed(2) : null,
        sma50:   sma50[i] != null ? +(sma50[i] as number).toFixed(2) : null,
        bbUpper: bb.upper[i] != null ? +(bb.upper[i] as number).toFixed(2) : null,
        bbLower: bb.lower[i] != null ? +(bb.lower[i] as number).toFixed(2) : null,
        rsi:     rsi[i] != null ? +(rsi[i] as number).toFixed(1) : null,
        macdHist: macd.histogram[i] != null ? +(macd.histogram[i] as number).toFixed(3) : null,
        macdLine: macd.macd[i] != null ? +(macd.macd[i] as number).toFixed(3) : null,
        macdSignal: macd.signal[i] != null ? +(macd.signal[i] as number).toFixed(3) : null,
      }));
      if (compare.length > 0 && compareSymbol) {
        const compareBase = compare[0]?.close || 500;
        const merged = normalized.map((d, i) => ({
          ...d,
          compareChange: +((compare[i]?.close ?? compareBase) / compareBase * 100 - 100).toFixed(3),
        }));
        setData(merged);
      } else {
        setData(normalized);
      }
      setLoading(false);
    });
  }, [symbol, range, compareSymbol, currentPrice]);

  if (loading) return <div style={{ height }} className="shimmer rounded-xl" />;

  const showCompare = !!compareSymbol;
  const dataKey   = showCompare ? 'change' : 'price';
  const lineColor = isPositive ? 'var(--green)' : 'var(--red)';
  const gradId    = `grad-${symbol}-${isPositive ? 'g' : 'r'}`;

  const tickFormatter = (v: string) => {
    if (!v) return '';
    const d = new Date(v);
    if (range === '1D' || range === '5D')
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (range === '1M' || range === '3M')
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Time range selectors + overlay toggles */}
      <div className="flex items-center gap-1 flex-wrap">
        {TIME_RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="font-mono text-[11px] font-medium rounded-lg transition-all duration-150"
            style={{
              padding: '4px 10px',
              background:   range === r ? 'rgba(255,255,255,0.08)' : 'transparent',
              color:        range === r ? 'var(--text-hi)' : 'var(--text-lo)',
              border:       range === r ? '1px solid var(--border-sub)' : '1px solid transparent',
            }}
          >
            {r}
          </button>
        ))}
        <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
        {OVERLAY_LABELS.map(o => (
          <button
            key={o.key}
            onClick={() => setOverlays(p => ({ ...p, [o.key]: !p[o.key] }))}
            className="font-mono text-[10px] font-medium rounded-lg transition-all duration-150"
            style={{
              padding: '3px 8px',
              background: overlays[o.key] ? 'rgba(138,164,255,0.15)' : 'transparent',
              color:      overlays[o.key] ? 'var(--accent)' : 'var(--text-lo)',
              border:     overlays[o.key] ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={isPositive ? '#55d99a' : '#ec6f86'} stopOpacity={0.16} />
              <stop offset="100%" stopColor={isPositive ? '#55d99a' : '#ec6f86'} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-compare" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#7da7ff" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#7da7ff" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="0"
            stroke="rgba(255,255,255,0.025)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-lo)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            interval="preserveStartEnd"
            tickFormatter={tickFormatter}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-lo)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            width={52}
            tickFormatter={v =>
              showCompare
                ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
                : `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`
            }
            domain={['auto', 'auto']}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }} />

          {showCompare && (
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          )}

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={1.75}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: 'var(--bg-base)', strokeWidth: 2 }}
            name={symbol}
          />

          {!showCompare && overlays.sma20 && (
            <Line type="monotone" dataKey="sma20" stroke="#ffc864" strokeWidth={1.25} dot={false} name="SMA 20" connectNulls />
          )}
          {!showCompare && overlays.sma50 && (
            <Line type="monotone" dataKey="sma50" stroke="#c792ea" strokeWidth={1.25} dot={false} name="SMA 50" connectNulls />
          )}
          {!showCompare && overlays.bb && (
            <Line type="monotone" dataKey="bbUpper" stroke="rgba(125,167,255,0.5)" strokeWidth={1} strokeDasharray="4 3" dot={false} name="BB Upper" connectNulls />
          )}
          {!showCompare && overlays.bb && (
            <Line type="monotone" dataKey="bbLower" stroke="rgba(125,167,255,0.5)" strokeWidth={1} strokeDasharray="4 3" dot={false} name="BB Lower" connectNulls />
          )}

          {showCompare && (
            <Area
              type="monotone"
              dataKey="compareChange"
              stroke="#7da7ff"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="url(#grad-compare)"
              dot={false}
              activeDot={{ r: 4, fill: '#7da7ff', stroke: 'var(--bg-base)', strokeWidth: 2 }}
              name={compareSymbol}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* RSI sub-chart */}
      {overlays.rsi && (
        <div>
          <p className="font-mono text-[10px]" style={{ color: 'var(--text-lo)', marginBottom: 4 }}>RSI (14)</p>
          <ResponsiveContainer width="100%" height={90}>
            <ComposedChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -8 }}>
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[0, 100]}
                ticks={[30, 70]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-lo)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                width={52}
              />
              <ReferenceLine y={70} stroke="rgba(255,107,107,0.3)" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="rgba(85,217,154,0.3)" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rsi" stroke="#7da7ff" strokeWidth={1.25} dot={false} name="RSI" connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD sub-chart */}
      {overlays.macd && (
        <div>
          <p className="font-mono text-[10px]" style={{ color: 'var(--text-lo)', marginBottom: 4 }}>MACD (12, 26, 9)</p>
          <ResponsiveContainer width="100%" height={90}>
            <ComposedChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -8 }}>
              <XAxis dataKey="date" hide />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-lo)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                width={52}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="macdHist" name="Histogram" fill="rgba(125,167,255,0.4)" />
              <Line type="monotone" dataKey="macdLine" stroke="#55d99a" strokeWidth={1} dot={false} name="MACD" connectNulls />
              <Line type="monotone" dataKey="macdSignal" stroke="#ffc864" strokeWidth={1} dot={false} name="Signal" connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
