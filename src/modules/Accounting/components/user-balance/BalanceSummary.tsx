import { formatCurrency } from '../../../../utils';

interface BalanceSummaryProps {
  totalRevenues: number;
  totalExpenses: number;
}

export function BalanceSummary({ totalRevenues, totalExpenses }: BalanceSummaryProps) {
  return (
    <div className="bg-surface-2 rounded-lg shadow-sm border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Résumé Global
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-500/10 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-400">Total Revenus</div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenues)}</div>
        </div>
        <div className="bg-red-500/10 p-4 rounded-lg">
          <div className="text-sm font-medium text-red-400">Total Dépenses</div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="bg-blue-500/10 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-400">Solde Global</div>
          <div className={`text-2xl font-bold ${totalRevenues - totalExpenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalRevenues - totalExpenses)}
          </div>
        </div>
      </div>
    </div>
  );
}
