import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioHolding } from '../../types';
import { SECTOR_COLORS, SECTOR_FALLBACK_COLOR } from '../../data/mockStocks';

interface AllocationChartProps {
  holdings: PortfolioHolding[];
  type?: 'stock' | 'sector';
  size?: number;
}

// Same soft, desaturated family as the app's --accent/--green/--amber/--red
// design tokens (see index.css), extended with a few more distinct hues so a
// 7-10 position portfolio doesn't repeat colors.
const COLORS = [
  '#8aa4ff', '#55d99a', '#d7a955', '#ec6f86', '#5ecfc4',
  '#e2915c', '#a896ff', '#e08fc2', '#7da7ff', '#8ea677',
];

interface Slice { name: string; value: number; color: string }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 10,
      background: 'var(--bg-overlay)', border: '1px solid var(--border-soft)',
      boxShadow: 'var(--panel-shadow)',
    }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{d.name}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-mid)' }}>
        {(d.value * 100).toFixed(1)}%
      </p>
    </div>
  );
};

interface LabelProps {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number; percent?: number;
}

const CustomLabel = ({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: LabelProps) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontFamily="JetBrains Mono, monospace" fontWeight={700}
      fill="rgba(7,9,13,0.82)"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function AllocationChart({ holdings, type = 'stock', size = 220 }: AllocationChartProps) {
  if (holdings.length === 0) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: size, fontSize: 12, color: 'var(--text-lo)',
    }}>
      No holdings to display
    </div>
  );

  let data: Slice[];

  if (type === 'stock') {
    data = holdings
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .map((h, i) => ({ name: h.symbol, value: h.weight, color: COLORS[i % COLORS.length] }));
  } else {
    const sectorMap: Record<string, number> = {};
    holdings.forEach(h => { sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.weight; });
    data = Object.entries(sectorMap)
      .sort((a, b) => b[1] - a[1])
      .map(([sector, weight]) => ({ name: sector, value: weight, color: SECTOR_COLORS[sector] || SECTOR_FALLBACK_COLOR }));
  }

  const centerLabel = type === 'stock'
    ? `${holdings.length} ${holdings.length === 1 ? 'position' : 'positions'}`
    : `${data.length} ${data.length === 1 ? 'sector' : 'sectors'}`;

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.29}
              outerRadius={size * 0.45}
              paddingAngle={2.5}
              cornerRadius={4}
              dataKey="value"
              labelLine={false}
              label={CustomLabel}
              isAnimationActive={false}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} stroke="var(--bg-base)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>
            {centerLabel}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: 6, marginTop: 14,
      }}>
        {data.map((d) => (
          <div
            key={d.name}
            title={`${d.name} · ${(d.value * 100).toFixed(1)}%`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
              fontSize: 11.5, color: 'var(--text-mid)', lineHeight: 1,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-hi)', fontWeight: 600 }}>{d.name}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5 }}>
              {(d.value * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
