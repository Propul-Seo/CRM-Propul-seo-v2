import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts';
import { formatCurrency } from '@/utils';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface ExpensesDistributionChartProps {
  chartData: ChartDataItem[];
}

interface DistributionTooltipProps extends TooltipProps<number, string> {
  total: number;
}

function formatPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function DistributionTooltip({ active, payload, total }: DistributionTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ChartDataItem;

  return (
    <div className="min-w-[210px] rounded-xl border border-white/14 bg-[#0d0a17]/95 px-4 py-3 text-violet-50 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
        <p className="text-sm font-semibold text-white">{item.name}</p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <p className="text-xl font-black tracking-tight text-rose-200">{formatCurrency(item.value)}</p>
        <p className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-xs font-bold text-violet-100/78">
          {formatPercent(item.value, total)}%
        </p>
      </div>
    </div>
  );
}

export function ExpensesDistributionChart({ chartData }: ExpensesDistributionChartProps) {
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="relative flex h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-rose-500/18 bg-[linear-gradient(180deg,rgba(17,13,29,0.96),rgba(8,7,14,0.98))] p-5">
        <p className="text-sm text-violet-100/55">Aucune dépense sur cette période</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-500/18 bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.08),transparent_34%),linear-gradient(180deg,rgba(17,13,29,0.96),rgba(8,7,14,0.98))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent" />

      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Répartition par nature</h3>
          <p className="mt-1 text-xs text-violet-100/46">Poids des dépenses filtrées</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs font-bold text-violet-100/72">
          {formatCurrency(total)}
        </span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart margin={{ top: 12, right: 18, bottom: 8, left: 18 }}>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={62} outerRadius={102} paddingAngle={1} dataKey="value" stroke="#0d0a17" strokeWidth={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DistributionTooltip total={total} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill="rgba(237,233,254,0.92)">
              <tspan x="50%" dy="-0.2em" fontSize="13" fontWeight="700">
                Total
              </tspan>
              <tspan x="50%" dy="1.55em" fontSize="14" fontWeight="800" fill="#fda4af">
                {formatCurrency(total)}
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 grid gap-2">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate text-sm font-semibold text-violet-50/82">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-sm font-bold text-white">{formatCurrency(item.value)}</span>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-bold text-violet-100/62">
                {formatPercent(item.value, total)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
