import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils';
import type { AccountingEntry } from '@/hooks/useMonthlyAccounting';
import { getExpenseCategoryLabel, getExpenseCategoryColorClasses } from '../constants';

type SortField = 'entry_date' | 'amount';
type SortDir = 'asc' | 'desc';

interface ExpensesDetailTableProps {
  entries: AccountingEntry[];
}

export function ExpensesDetailTable({ entries }: ExpensesDetailTableProps) {
  const [sortField, setSortField] = useState<SortField>('entry_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      const cmp = sortField === 'entry_date' ? a.entry_date.localeCompare(b.entry_date) : a.amount - b.amount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [entries, sortField, sortDir]);

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-surface-2 to-surface-2/50 p-5">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Détail des dépenses</h3>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Aucune dépense sur cette période</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-3 py-2 text-left">
                  <SortBtn field="entry_date" label="Date" />
                </th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="whitespace-nowrap px-3 py-2 text-left">Catégorie</th>
                <th className="px-3 py-2 text-right">
                  <SortBtn field="amount" label="Montant" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.id} className="border-b border-border/20 transition-colors hover:bg-surface-2/30">
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {new Date(row.entry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{row.description}</td>
                  <td className="px-3 py-2.5">
                    <Badge className={getExpenseCategoryColorClasses(row.category)}>{getExpenseCategoryLabel(row.category)}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-rose-300">-{formatCurrency(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
