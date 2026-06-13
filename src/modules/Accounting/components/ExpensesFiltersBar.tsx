import { Filter, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type RevenuePeriodFilter } from '../constants';

interface ExpensesFiltersBarProps {
  period: RevenuePeriodFilter;
  categoryFilter: 'all' | ExpenseCategory;
  search: string;
  onPeriodChange: (v: RevenuePeriodFilter) => void;
  onCategoryFilterChange: (v: 'all' | ExpenseCategory) => void;
  onSearchChange: (v: string) => void;
  exportSlot?: ReactNode;
}

export function ExpensesFiltersBar({
  period,
  categoryFilter,
  search,
  onPeriodChange,
  onCategoryFilterChange,
  onSearchChange,
  exportSlot,
}: ExpensesFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtres
      </div>

      <select
        value={period}
        onChange={(e) => onPeriodChange(e.target.value as RevenuePeriodFilter)}
        className="h-10 min-w-[140px] rounded-xl border border-white/10 bg-surface-2/80 px-3 text-sm font-medium text-foreground outline-none transition-colors hover:border-white/20 focus:border-primary/60"
      >
        <option value="month">Ce mois</option>
        <option value="quarter">Ce trimestre</option>
        <option value="year">Cette année</option>
      </select>

      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value as 'all' | ExpenseCategory)}
        className="h-10 min-w-[180px] rounded-xl border border-white/10 bg-surface-2/80 px-3 text-sm font-medium text-foreground outline-none transition-colors hover:border-white/20 focus:border-primary/60"
      >
        <option value="all">Toutes catégories</option>
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <div className="relative min-w-[220px] flex-1 sm:flex-none">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une dépense..."
          className="h-10 w-full rounded-xl border border-white/10 bg-surface-2/80 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-white/20 focus:border-primary/60 sm:w-[230px]"
        />
      </div>

      {exportSlot}
    </div>
  );
}
