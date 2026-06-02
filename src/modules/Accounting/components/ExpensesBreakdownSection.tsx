import { ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpensesBreakdown } from '../hooks/useExpensesBreakdown';
import { getExpenseCategoryLabel } from '../constants';
import type { AccountingExportRow } from '../lib/exportCsv';
import { ExpensesFiltersBar } from './ExpensesFiltersBar';
import { ExpensesDistributionChart } from './ExpensesDistributionChart';
import { ExpensesDetailTable } from './ExpensesDetailTable';
import { AccountingExportButton } from './AccountingExportButton';

interface ExpensesBreakdownSectionProps {
  isMobile: boolean;
}

export function ExpensesBreakdownSection({ isMobile }: ExpensesBreakdownSectionProps) {
  const { loading, period, setPeriod, categoryFilter, setCategoryFilter, search, setSearch, chartData, filteredEntries } =
    useExpensesBreakdown();

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-rose-500" />
      </div>
    );
  }

  const exportRows: AccountingExportRow[] = filteredEntries.map((e) => ({
    date: e.entry_date,
    type: 'Dépense',
    category: getExpenseCategoryLabel(e.category),
    sousCategorie: '',
    description: e.description,
    amount: e.amount,
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-rose-300">
            <ArrowDownRight className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
          <div>
            <h2 className={cn('font-semibold text-white', isMobile ? 'text-base' : 'text-lg')}>
              Répartition des dépenses par catégorie
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Analyse des dépenses par nature, sur la période sélectionnée.</p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-medium text-muted-foreground">
          {filteredEntries.length} ligne{filteredEntries.length > 1 ? 's' : ''}
        </span>
      </div>

      <ExpensesFiltersBar
        period={period}
        categoryFilter={categoryFilter}
        search={search}
        onPeriodChange={setPeriod}
        onCategoryFilterChange={setCategoryFilter}
        onSearchChange={setSearch}
        exportSlot={<AccountingExportButton rows={exportRows} filenameBase={`depenses_${period}`} />}
      />

      <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
        <ExpensesDistributionChart chartData={chartData} />
        <ExpensesDetailTable entries={filteredEntries} />
      </div>
    </section>
  );
}
