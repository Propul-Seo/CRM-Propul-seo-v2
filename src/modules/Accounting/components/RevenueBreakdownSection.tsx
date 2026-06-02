import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PieChart } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useRevenueBreakdown } from '../hooks/useRevenueBreakdown';
import { getCategoryLabel, getSousCategorieLabel } from '../constants';
import type { AnnualStats } from '../../../hooks/useAnnualAccounting';
import type { AccountingExportRow } from '../lib/exportCsv';
import { RevenueEvolutionChart } from './RevenueEvolutionChart';
import { RevenueDistributionChart } from './RevenueDistributionChart';
import { RevenueFiltersBar } from './RevenueFiltersBar';
import { RevenueDetailTable } from './RevenueDetailTable';
import { MarginRatiosSection } from './MarginRatiosSection';
import { AnnualTableSection } from './AnnualTableSection';
import { ExpensesBreakdownSection } from './ExpensesBreakdownSection';
import { AccountingExportButton } from './AccountingExportButton';
import { MonthRevenueDrawer } from './MonthRevenueDrawer';

interface RevenueBreakdownSectionProps {
  annualStats: AnnualStats;
  currentYear: number;
  selectedMonth: Date;
  isMobile: boolean;
  onAddTransaction: () => void;
  monthlySummary?: ReactNode;
  currentMonthStats: { revenue: number; expenses: number; result: number; transactionCount: number };
  onSelectMonth?: (date: Date) => void;
}

export function RevenueBreakdownSection({
  annualStats,
  currentYear,
  selectedMonth,
  isMobile,
  onAddTransaction,
  monthlySummary,
  currentMonthStats,
  onSelectMonth,
}: RevenueBreakdownSectionProps) {
  const {
    filteredRows,
    loading,
    period,
    setPeriod,
    categoryFilter,
    setCategoryFilter,
    clientSearch,
    setClientSearch,
    categoryTotals,
    categoryPercentages,
    chartData,
    communicationChartData,
  } = useRevenueBreakdown();

  const [detailMonth, setDetailMonth] = useState<Date | null>(null);
  const handleMonthClick = (date: Date) => {
    onSelectMonth?.(date);
    setDetailMonth(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-2 border-border border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const exportRows: AccountingExportRow[] = filteredRows.map((row) => ({
    date: row.entry_date,
    type: 'Revenu',
    category: getCategoryLabel(row.alloc_category),
    sousCategorie: getSousCategorieLabel(row.alloc_sous_categorie),
    description: row.description,
    amount: row.alloc_amount,
  }));

  return (
    <motion.div
      id="accounting-revenue-breakdown"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <RevenueEvolutionChart
        annualStats={annualStats}
        currentYear={currentYear}
        selectedMonth={selectedMonth}
        categoryTotals={categoryTotals}
        categoryPercentages={categoryPercentages}
        isMobile={isMobile}
        onAddTransaction={onAddTransaction}
      />

      {monthlySummary}

      <MarginRatiosSection
        resultMonth={currentMonthStats.result}
        revenueMonth={currentMonthStats.revenue}
        resultYear={annualStats.totalResult}
        revenueYear={annualStats.totalRevenues}
        selectedMonth={selectedMonth}
        currentYear={currentYear}
        isMobile={isMobile}
      />

      <AnnualTableSection
        annualStats={annualStats}
        currentYear={currentYear}
        selectedMonth={selectedMonth}
        isMobile={isMobile}
        onSelectMonth={handleMonthClick}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-muted-foreground">
              <PieChart className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
            </div>
            <div>
              <h2 className={cn('font-semibold text-white', isMobile ? 'text-base' : 'text-lg')}>
                Répartition du chiffre d'affaires
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Analyse des revenus par offre, catégorie et client.
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-medium text-muted-foreground">
            {filteredRows.length} ligne{filteredRows.length > 1 ? 's' : ''}
          </span>
        </div>

        <RevenueFiltersBar
          period={period}
          categoryFilter={categoryFilter}
          clientSearch={clientSearch}
          onPeriodChange={setPeriod}
          onCategoryFilterChange={setCategoryFilter}
          onClientSearchChange={setClientSearch}
          exportSlot={<AccountingExportButton rows={exportRows} filenameBase={`revenus_${period}`} />}
        />

        <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
          <RevenueDistributionChart
            chartData={chartData}
            communicationChartData={communicationChartData}
            categoryFilter={categoryFilter}
          />
          <RevenueDetailTable
            rows={filteredRows}
            categoryFilter={categoryFilter}
          />
        </div>
      </section>

      <ExpensesBreakdownSection isMobile={isMobile} />

      <MonthRevenueDrawer month={detailMonth} onClose={() => setDetailMonth(null)} />
    </motion.div>
  );
}
