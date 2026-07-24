import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import type { TimeRange } from '../../types';
import { getStockHistory } from '../../utils/api';
import { getCurrencySymbol } from '../../config/markets';

const TIME_RANGES: TimeRange[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y'];

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  compareSymbol?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label, ccy = '$' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="cs-tooltip">
      <p className="font-mono text-[10px] mb-2" style={{ color: 'var(--text-lo)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number'
            ? p.name?.includes('%') || p.dataKey === 'change' || p.dataKey === 'compareChange'
              ? `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}%`
              : `${ccy}${p.value.toFixed(2)}`
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
      const normalized = history.map(p => ({
        date:   p.date,
        price:  +p.close.toFixed(2),
        change: +((p.close / basePrice - 1) * 100).toFixed(3),
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
  const ccy       = getCurrencySymbol(symbol);

  return (
    <div className="flex flex-col gap-4">
      {/* Time range selectors */}
      <div className="flex items-center gap-1">
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
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: -8 }}>
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
            tickFormatter={v => {
              if (!v) return '';
              const d = new Date(v);
              if (range === '1D' || range === '5D')
                return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              if (range === '1M' || range === '3M')
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            }}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-lo)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            width={52}
            tickFormatter={v =>
              showCompare
                ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
                : `${ccy}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`
            }
            domain={['auto', 'auto']}
          />

          <Tooltip content={(props: any) => <CustomTooltip {...props} ccy={showCompare ? '' : ccy} />} cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }} />

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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
