import { Globe, Megaphone, Server } from 'lucide-react';
import { formatCurrency } from '../../../utils';
import { cn } from '../../../lib/utils';

interface RevenueCategoryCardsProps {
  categoryTotals: { site_internet: number; erp: number; communication: number };
  categoryPercentages: { site_internet: number; erp: number; communication: number };
  isMobile: boolean;
}

const cards = [
  {
    key: 'site_internet',
    label: 'Site Internet',
    icon: Globe,
    valueClass: 'text-cyan-300',
    iconClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20',
    glowClass: 'from-cyan-500/10',
  },
  {
    key: 'erp',
    label: 'ERP',
    icon: Server,
    valueClass: 'text-violet-300',
    iconClass: 'bg-violet-500/10 text-violet-300 border-violet-400/20',
    glowClass: 'from-violet-500/10',
  },
  {
    key: 'communication',
    label: 'Autres sources',
    icon: Megaphone,
    valueClass: 'text-amber-300',
    iconClass: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
    glowClass: 'from-amber-500/10',
  },
] as const;

export function RevenueCategoryCards({ categoryTotals, categoryPercentages, isMobile }: RevenueCategoryCardsProps) {
  return (
    <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3')}>
      {cards.map(({ key, label, icon: Icon, valueClass, iconClass, glowClass }) => (
        <article
          key={key}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-white/18"
        >
          <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent opacity-80', glowClass)} />
          <div className={cn('absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-70', glowClass)} />

          <div className="relative flex min-h-[132px] flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div className={cn('grid h-10 w-10 place-items-center rounded-xl border', iconClass)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-white/[0.055] px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {categoryPercentages[key]}%
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className={cn('mt-1 text-2xl font-bold tracking-tight', valueClass)}>
                {formatCurrency(categoryTotals[key])}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">du chiffre d'affaires filtré</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
