import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { computeDelta } from '../utils/computeDelta';

interface DeltaBadgeProps {
  current: number;
  previous: number;
  lowerIsBetter?: boolean;
}

const eurFormatter = new Intl.NumberFormat('fr-FR', { signDisplay: 'always', maximumFractionDigits: 0 });
const pctFormatter = new Intl.NumberFormat('fr-FR', { signDisplay: 'always', maximumFractionDigits: 1 });

export function DeltaBadge({ current, previous, lowerIsBetter }: DeltaBadgeProps) {
  const { absolute, percent, trend, isGood } = computeDelta(current, previous, { lowerIsBetter });
  const color = trend === 'flat' ? 'text-violet-100/40' : isGood ? 'text-emerald-300' : 'text-rose-300';
  const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium">
      <span className={cn('inline-flex items-center gap-0.5', color)}>
        <Icon className="h-3 w-3" />
        {eurFormatter.format(absolute)} €
        {percent !== null && <span className="ml-0.5">({pctFormatter.format(percent)} %)</span>}
        {percent === null && current !== 0 && <span className="ml-0.5">(nouveau)</span>}
      </span>
      <span className="text-violet-100/40">vs mois préc.</span>
    </div>
  );
}
