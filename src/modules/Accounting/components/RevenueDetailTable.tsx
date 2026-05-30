import { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { formatCurrency } from '../../../utils';
import { getCategoryLabel, getCategoryColorClasses, getSousCategorieLabel } from '../constants';
import type { AccountingEntry } from '../../../hooks/useMonthlyAccounting';
import type { RevenueCategory } from '../constants';

type SortField = 'entry_date' | 'alloc_amount' | 'description';
type SortDir = 'asc' | 'desc';

export interface ExpandedRow extends AccountingEntry {
  alloc_category: string;
  alloc_sous_categorie: string | null;
  alloc_amount: number;
}

interface RevenueDetailTableProps {
  rows: ExpandedRow[];
  categoryFilter: 'all' | RevenueCategory;
}

function SortableTable({ rows }: { rows: ExpandedRow[] }) {
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
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'entry_date') cmp = a.entry_date.localeCompare(b.entry_date);
      else if (sortField === 'alloc_amount') cmp = a.alloc_amount - b.alloc_amount;
      else cmp = a.description.localeCompare(b.description);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortField, sortDir]);

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Aucun revenu dans cette catégorie
      </div>
    );
  }

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-2 px-3"><SortBtn field="entry_date" label="Date" /></th>
            <th className="text-left py-2 px-3"><SortBtn field="description" label="Description" /></th>
            <th className="text-left py-2 px-3 whitespace-nowrap">Catégorie</th>
            <th className="text-right py-2 px-3"><SortBtn field="alloc_amount" label="Montant" /></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={`${row.id}-${row.alloc_category}-${i}`} className="border-b border-border/20 hover:bg-surface-2/30 transition-colors">
              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                {new Date(row.entry_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="py-2.5 px-3 text-foreground font-medium">{row.description}</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <Badge className={getCategoryColorClasses(row.alloc_category)}>
                    {getCategoryLabel(row.alloc_category)}
                  </Badge>
                  {row.alloc_sous_categorie && (
                    <span className="text-xs text-muted-foreground">
                      {getSousCategorieLabel(row.alloc_sous_categorie)}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold whitespace-nowrap">
                +{formatCurrency(row.alloc_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RevenueDetailTable({ rows, categoryFilter }: RevenueDetailTableProps) {
  const byCat = useMemo(() => ({
    site_internet: rows.filter((r) => r.alloc_category === 'site_internet'),
    erp: rows.filter((r) => r.alloc_category === 'erp'),
    communication: rows.filter((r) => r.alloc_category === 'communication'),
  }), [rows]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Détail des revenus</h3>

      {categoryFilter === 'all' ? (
        <Tabs defaultValue="site_internet">
          <TabsList className="mb-3">
            <TabsTrigger value="site_internet">
              Site Internet ({byCat.site_internet.length})
            </TabsTrigger>
            <TabsTrigger value="erp">
              ERP ({byCat.erp.length})
            </TabsTrigger>
            <TabsTrigger value="communication">
              Autres sources ({byCat.communication.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="site_internet">
            <SortableTable rows={byCat.site_internet} />
          </TabsContent>
          <TabsContent value="erp">
            <SortableTable rows={byCat.erp} />
          </TabsContent>
          <TabsContent value="communication">
            <SortableTable rows={byCat.communication} />
          </TabsContent>
        </Tabs>
      ) : (
        <SortableTable rows={rows} />
      )}
    </div>
  );
}
