import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { FinancialCard } from './FinancialCard';
import { formatCurrency } from '../../../utils';
import { cn } from '../../../lib/utils';

export function AnnualStatsSection({
  annualStats,
  generateSparklineData,
  currentYear,
  isMobile
}: {
  annualStats: {
    totalRevenues: number;
    totalExpenses: number;
    totalResult: number;
    averageRevenue: number;
    averageExpenses: number;
    totalMonths: number;
  };
  generateSparklineData: (base: number, variance?: number) => number[];
  currentYear: number;
  isMobile: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className={cn("text-muted-foreground", isMobile ? "h-4 w-4" : "h-5 w-5")} />
        <h2 className={cn("font-semibold text-white", isMobile ? "text-base" : "text-lg")}>Vue annuelle {currentYear}</h2>
      </div>
      <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        <FinancialCard
          icon={TrendingUp}
          label="Revenus Totaux"
          value={annualStats.totalRevenues}
          subtitle={`Moyenne: ${formatCurrency(annualStats.averageRevenue)}/mois`}
          trend="up"
          trendValue="+12%"
          color="emerald"
          sparklineData={generateSparklineData(annualStats.averageRevenue)}
          delay={0.1}
        />
        <FinancialCard
          icon={TrendingDown}
          label="Dépenses Totales"
          value={annualStats.totalExpenses}
          subtitle={`Moyenne: ${formatCurrency(annualStats.averageExpenses)}/mois`}
          trend="down"
          trendValue="-5%"
          color="rose"
          sparklineData={generateSparklineData(annualStats.averageExpenses)}
          delay={0.15}
        />
        <FinancialCard
          icon={Wallet}
          label="Résultat Global"
          value={annualStats.totalResult}
          subtitle={`${annualStats.totalMonths} mois analysés`}
          trend={annualStats.totalResult >= 0 ? 'up' : 'down'}
          trendValue={annualStats.totalResult >= 0 ? 'Positif' : 'Négatif'}
          color={annualStats.totalResult >= 0 ? 'cyan' : 'rose'}
          delay={0.2}
        />
      </div>
    </div>
  );
}
