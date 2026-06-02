import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils';
import type { AnnualStats } from '@/hooks/useAnnualAccounting';
import { MONTH_FULL_LABELS, MONTH_LABELS } from '../constants';

interface AnnualTableSectionProps {
  annualStats: AnnualStats;
  currentYear: number;
  selectedMonth: Date;
  isMobile: boolean;
  onSelectMonth?: (date: Date) => void;
}

interface MonthRow {
  index: number;
  monthKey: string;
  label: string;
  revenues: number;
  expenses: number;
  result: number;
  count: number;
  isSelected: boolean;
}

export function AnnualTableSection({ annualStats, currentYear, selectedMonth, isMobile, onSelectMonth }: AnnualTableSectionProps) {
  const selectedKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
  const labels = isMobile ? MONTH_LABELS : MONTH_FULL_LABELS;
  const interactive = Boolean(onSelectMonth);

  const rows: MonthRow[] = Array.from({ length: 12 }, (_, index) => {
    const monthKey = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
    const stats = annualStats.monthlyStats[monthKey];
    return {
      index,
      monthKey,
      label: labels[index],
      revenues: stats?.revenues ?? 0,
      expenses: stats?.expenses ?? 0,
      result: stats?.result ?? 0,
      count: stats?.count ?? 0,
      isSelected: monthKey === selectedKey,
    };
  });

  const totalCount = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-500/22 bg-[radial-gradient(circle_at_16%_0%,rgba(34,211,238,0.06),transparent_30%),linear-gradient(180deg,rgba(18,13,31,0.96),rgba(9,8,15,0.98))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />

      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-violet-100">
          <CalendarRange className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100/42">Vue annuelle</p>
          <h2 className={cn('font-semibold text-white', isMobile ? 'text-base' : 'text-lg')}>Détail mois par mois — {currentYear}</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs font-medium text-muted-foreground">
              <th className="px-3 py-2 text-left">Mois</th>
              <th className="whitespace-nowrap px-3 py-2 text-right">CA</th>
              <th className="whitespace-nowrap px-3 py-2 text-right">Dépenses</th>
              <th className="whitespace-nowrap px-3 py-2 text-right">Résultat</th>
              <th className="whitespace-nowrap px-3 py-2 text-right">{isMobile ? 'Tx' : 'Transactions'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.monthKey}
                onClick={interactive ? () => onSelectMonth?.(new Date(currentYear, row.index, 1)) : undefined}
                className={cn(
                  'border-b border-border/20 transition-colors',
                  interactive && 'cursor-pointer hover:bg-surface-2/30',
                  row.isSelected && 'bg-violet-500/12',
                )}
              >
                <td className={cn('px-3 py-2.5 font-medium capitalize text-foreground', row.isSelected && 'border-l-2 border-l-cyan-400')}>
                  {row.label}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-cyan-300">{formatCurrency(row.revenues)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-rose-300">{formatCurrency(row.expenses)}</td>
                <td className={cn('whitespace-nowrap px-3 py-2.5 text-right font-bold', row.result >= 0 ? 'text-cyan-300' : 'text-rose-300')}>
                  {formatCurrency(row.result)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-violet-200">{row.count}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/15 font-bold">
              <td className="px-3 py-2.5 text-foreground">Total {currentYear}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-cyan-300">{formatCurrency(annualStats.totalRevenues)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-rose-300">{formatCurrency(annualStats.totalExpenses)}</td>
              <td className={cn('whitespace-nowrap px-3 py-2.5 text-right', annualStats.totalResult >= 0 ? 'text-cyan-300' : 'text-rose-300')}>
                {formatCurrency(annualStats.totalResult)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-violet-200">{totalCount}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
