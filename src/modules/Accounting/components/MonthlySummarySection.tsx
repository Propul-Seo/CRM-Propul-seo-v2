import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Receipt, PieChart, Activity, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '../../../lib/utils';

interface SummaryCard {
  label: string;
  caption: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  tone: {
    icon: string;
    value: string;
    glow: string;
    border: string;
  };
}

export function MonthlySummarySection({
  selectedMonth,
  currentMonthStats,
  isMobile,
  onManageTransactions
}: {
  selectedMonth: Date;
  currentMonthStats: {
    revenue: number;
    expenses: number;
    result: number;
    transactionCount: number;
  };
  isMobile: boolean;
  onManageTransactions?: () => void;
}) {
  const monthLabel = selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const resultIsPositive = currentMonthStats.result >= 0;

  const cards: SummaryCard[] = [
    {
      label: 'Revenus',
      caption: 'Encaissements du mois',
      value: currentMonthStats.revenue,
      suffix: '€',
      icon: ArrowUpRight,
      tone: {
        icon: 'bg-emerald-400/12 text-emerald-300 ring-emerald-300/18',
        value: 'text-emerald-300',
        glow: 'from-emerald-300/16',
        border: 'hover:border-emerald-300/28',
      },
    },
    {
      label: 'Dépenses',
      caption: 'Sorties enregistrées',
      value: currentMonthStats.expenses,
      suffix: '€',
      icon: ArrowDownRight,
      tone: {
        icon: 'bg-rose-400/12 text-rose-300 ring-rose-300/18',
        value: 'text-rose-300',
        glow: 'from-rose-300/16',
        border: 'hover:border-rose-300/28',
      },
    },
    {
      label: 'Résultat',
      caption: resultIsPositive ? 'Solde positif' : 'Solde à surveiller',
      value: currentMonthStats.result,
      suffix: '€',
      icon: PieChart,
      tone: {
        icon: resultIsPositive
          ? 'bg-cyan-300/12 text-cyan-300 ring-cyan-300/18'
          : 'bg-rose-400/12 text-rose-300 ring-rose-300/18',
        value: resultIsPositive ? 'text-cyan-300' : 'text-rose-300',
        glow: resultIsPositive ? 'from-cyan-300/16' : 'from-rose-300/16',
        border: resultIsPositive ? 'hover:border-cyan-300/28' : 'hover:border-rose-300/28',
      },
    },
    {
      label: 'Transactions',
      caption: 'Lignes du mois',
      value: currentMonthStats.transactionCount,
      icon: Activity,
      tone: {
        icon: 'bg-violet-400/14 text-violet-200 ring-violet-300/18',
        value: 'text-violet-200',
        glow: 'from-violet-300/16',
        border: 'hover:border-violet-300/28',
      },
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/22 bg-[radial-gradient(circle_at_16%_0%,rgba(45,212,191,0.08),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(168,85,247,0.14),transparent_32%),linear-gradient(180deg,rgba(18,13,31,0.96),rgba(9,8,15,0.98))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      aria-label={`Synthèse mensuelle ${monthLabel}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Receipt className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100/42">
              Synthèse mensuelle
            </p>
            <h2 className={cn('font-semibold capitalize text-white', isMobile ? 'text-base' : 'text-lg')}>
              {monthLabel}
            </h2>
          </div>
        </div>

        {onManageTransactions && (
          <button
            onClick={onManageTransactions}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-semibold text-violet-100/78 transition hover:border-cyan-300/25 hover:bg-white/[0.085] hover:text-white"
          >
            <Settings className="h-4 w-4" />
            <span>Gérer les transactions</span>
          </button>
        )}
      </div>

      <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4')}>
        {cards.map(({ label, caption, value, suffix, icon: Icon, tone }) => (
          <div
            key={label}
            className={cn(
              'group relative min-h-[116px] overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.055]',
              tone.border
            )}
          >
            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition group-hover:opacity-100', tone.glow)} />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-violet-100/66">{label}</p>
                <p className="mt-1 text-xs text-violet-100/40">{caption}</p>
              </div>
              <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1', tone.icon)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className={cn('relative mt-4 text-2xl font-black leading-none tracking-tight sm:text-3xl', tone.value)}>
              <AnimatedCounter value={value} suffix={suffix} />
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
