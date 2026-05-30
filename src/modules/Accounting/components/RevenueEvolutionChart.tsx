import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { formatCurrency } from '../../../utils';
import { cn } from '../../../lib/utils';
import type { AnnualStats } from '../../../hooks/useAnnualAccounting';

const MONTH_LABELS = ['janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.'];
const MONTH_FULL_LABELS = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

interface RevenueEvolutionChartProps {
  annualStats: AnnualStats;
  currentYear: number;
  selectedMonth: Date;
  categoryTotals: { site_internet: number; erp: number; communication: number };
  categoryPercentages: { site_internet: number; erp: number; communication: number };
  isMobile: boolean;
}

interface ChartPoint {
  monthKey: string;
  label: string;
  fullLabel: string;
  revenue: number;
  isSelected: boolean;
}

function formatAxisCurrency(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}k€`;
  return `${value}€`;
}

function RevenueTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload as ChartPoint;

  return (
    <div className="rounded-lg border border-white/25 bg-white px-4 py-3 shadow-2xl">
      <p className="mb-2 text-sm font-semibold text-[#ddd6fe]">
        {point.fullLabel} {point.monthKey.slice(0, 4)}
      </p>
      <p className="text-sm font-bold text-[#a855f7]">
        Chiffre d'affaires : {formatCurrency(point.revenue)}
      </p>
    </div>
  );
}

export function RevenueEvolutionChart({
  annualStats,
  currentYear,
  selectedMonth,
  categoryTotals,
  categoryPercentages,
  isMobile,
}: RevenueEvolutionChartProps) {
  const selectedMonthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;

  const data = useMemo<ChartPoint[]>(() => (
    Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthKey = `${currentYear}-${String(month).padStart(2, '0')}`;
      return {
        monthKey,
        label: MONTH_LABELS[index],
        fullLabel: MONTH_FULL_LABELS[index],
        revenue: annualStats.monthlyStats[monthKey]?.revenues ?? 0,
        isSelected: monthKey === selectedMonthKey,
      };
    })
  ), [annualStats.monthlyStats, currentYear, selectedMonthKey]);

  const maxRevenue = Math.max(...data.map(point => point.revenue), 0);
  const yMax = maxRevenue > 0 ? Math.ceil((maxRevenue * 1.18) / 1000) * 1000 : 12000;
  const selectedPoint = data.find(point => point.isSelected);
  const bestPoint = data.reduce((best, point) => (point.revenue > best.revenue ? point : best), data[0]);

  const sourceRows = [
    {
      label: 'Site Internet',
      value: formatCurrency(categoryTotals.site_internet),
      percent: categoryPercentages.site_internet,
      valueClass: 'text-cyan-300',
    },
    {
      label: 'ERP',
      value: formatCurrency(categoryTotals.erp),
      percent: categoryPercentages.erp,
      valueClass: 'text-violet-200',
    },
    {
      label: 'Autres sources',
      value: formatCurrency(categoryTotals.communication),
      percent: categoryPercentages.communication,
      valueClass: 'text-amber-300',
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-[radial-gradient(circle_at_18%_10%,rgba(147,51,234,0.16),transparent_32%),linear-gradient(180deg,rgba(19,13,35,0.98),rgba(8,7,14,0.99))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:p-5"
      aria-label="Evolution du chiffre d'affaires"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-violet-200">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className={cn('font-semibold text-white', isMobile ? 'text-base' : 'text-lg')}>
              Evolution du chiffre d'affaires
            </h2>
            <p className="text-sm text-violet-100/70">Reporting mensuel</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <aside className="min-w-0">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="min-h-[150px] rounded-xl border border-white/10 bg-white/[0.045] p-4 sm:col-span-2">
              <p className="text-xs font-semibold text-violet-100/62">CA annuel</p>
              <p className="mt-3 text-4xl font-black leading-none tracking-tight text-emerald-300 sm:text-5xl">
                {formatCurrency(annualStats.totalRevenues)}
              </p>
              <p className="mt-3 text-xs text-violet-100/48">
                {currentYear} · {annualStats.activeMonths} mois actifs
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-xs font-semibold capitalize text-violet-100/62">
                {selectedPoint?.fullLabel ?? 'Mois sélectionné'}
              </p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-cyan-300">
                {formatCurrency(selectedPoint?.revenue ?? 0)}
              </p>
              <p className="mt-2 text-xs text-violet-100/45">mois sélectionné</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-xs font-semibold text-violet-100/62">Meilleur mois</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-violet-200">
                {formatCurrency(bestPoint.revenue)}
              </p>
              <p className="mt-2 text-xs capitalize text-violet-100/45">{bestPoint.fullLabel}</p>
            </div>
          </div>

          <div className="mt-3 divide-y divide-white/[0.08] border-t border-white/[0.09]">
            {sourceRows.map(({ label, value, percent, valueClass }) => (
              <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <span className="min-w-0 text-sm font-semibold text-violet-100/70">{label}</span>
                <strong className={cn('whitespace-nowrap text-right text-base font-bold', valueClass)}>
                  {value} · {percent}%
                </strong>
              </div>
            ))}
          </div>
        </aside>

        <div className={cn(
          'min-w-0 rounded-xl border border-white/[0.09] bg-black/[0.12]',
          isMobile ? 'h-[300px] overflow-x-auto overflow-y-hidden' : 'h-[410px]',
        )}>
          <div className={cn('h-full', isMobile ? 'min-w-[760px]' : 'w-full')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 56, right: 20, left: 12, bottom: 24 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.14)" strokeDasharray="4 5" vertical horizontal />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  domain={[0, yMax]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12 }}
                  tickFormatter={formatAxisCurrency}
                  width={58}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.72)', strokeWidth: 1.5 }}
                  content={<RevenueTooltip />}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#9b35ff"
                  strokeWidth={4}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={(payload as ChartPoint).isSelected ? 8 : 6}
                      fill={(payload as ChartPoint).isSelected ? '#ffffff' : '#9b35ff'}
                      stroke={(payload as ChartPoint).isSelected ? '#a855f7' : '#140d23'}
                      strokeWidth={(payload as ChartPoint).isSelected ? 4 : 3}
                    />
                  )}
                  activeDot={{ r: 8, fill: '#ffffff', stroke: '#a855f7', strokeWidth: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
