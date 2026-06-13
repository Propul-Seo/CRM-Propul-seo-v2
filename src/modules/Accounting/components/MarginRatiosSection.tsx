import { motion } from 'framer-motion';
import { Minus, Percent, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { computeMarginRate, formatMarginRate } from '../utils/margins';

interface MarginRatiosSectionProps {
  resultMonth: number;
  revenueMonth: number;
  resultYear: number;
  revenueYear: number;
  selectedMonth: Date;
  currentYear: number;
  isMobile: boolean;
}

interface MarginTone {
  value: string;
  icon: string;
  glow: string;
  Icon: LucideIcon;
}

function rateTone(rate: number | null): MarginTone {
  if (rate === null) {
    return { value: 'text-violet-100/50', icon: 'bg-violet-400/12 text-violet-200 ring-violet-300/18', glow: 'from-violet-300/16', Icon: Minus };
  }
  if (rate >= 0) {
    return { value: 'text-cyan-300', icon: 'bg-cyan-300/12 text-cyan-300 ring-cyan-300/18', glow: 'from-cyan-300/16', Icon: TrendingUp };
  }
  return { value: 'text-rose-300', icon: 'bg-rose-400/12 text-rose-300 ring-rose-300/18', glow: 'from-rose-300/16', Icon: TrendingDown };
}

export function MarginRatiosSection({
  resultMonth,
  revenueMonth,
  resultYear,
  revenueYear,
  selectedMonth,
  currentYear,
  isMobile,
}: MarginRatiosSectionProps) {
  const monthLabel = selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const cards = [
    { label: 'Marge du mois', caption: monthLabel, rate: computeMarginRate(resultMonth, revenueMonth) },
    { label: 'Marge annuelle', caption: `${currentYear} cumulé`, rate: computeMarginRate(resultYear, revenueYear) },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/22 bg-[radial-gradient(circle_at_16%_0%,rgba(45,212,191,0.08),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(168,85,247,0.14),transparent_32%),linear-gradient(180deg,rgba(18,13,31,0.96),rgba(9,8,15,0.98))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      aria-label="Marges et ratios"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />

      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Percent className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100/42">Marges &amp; ratios</p>
          <h2 className={cn('font-semibold text-white', isMobile ? 'text-base' : 'text-lg')}>Taux de marge (résultat / CA)</h2>
        </div>
      </div>

      <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        {cards.map(({ label, caption, rate }) => {
          const tone = rateTone(rate);
          const Icon = tone.Icon;
          return (
            <div
              key={label}
              className="group relative min-h-[116px] overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.055]"
            >
              <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition group-hover:opacity-100', tone.glow)} />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-violet-100/66">{label}</p>
                  <p className="mt-1 text-xs capitalize text-violet-100/40">{caption}</p>
                </div>
                <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1', tone.icon)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={cn('relative mt-4 text-2xl font-black leading-none tracking-tight sm:text-3xl', tone.value)}>
                {formatMarginRate(rate)}
              </p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
