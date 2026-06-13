import { User } from 'lucide-react';
import { formatCurrency } from '../../../../utils';
import { getRevenueSharePercentage, computeRowMetrics } from '../../lib/balanceCalculations';
import type { UserBalanceData } from '../../types/userBalance';

interface BalanceTableProps {
  usersWithData: UserBalanceData[];
  totalRevenues: number;
  totalExpenses: number;
}

export function BalanceTable({ usersWithData, totalRevenues, totalExpenses }: BalanceTableProps) {
  return (
    <div className="bg-surface-2 rounded-lg shadow-sm border border-border">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Répartition des Parts et Charges
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Team: 51% | Paul: 24.5% | Antoine: 24.5% | Charges: équitables (33.33% chacun)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Temps réel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-1">
            <tr>
              {['Utilisateur', 'Revenus Réels', 'Revenus Théoriques', 'Différence Revenus', 'Charges Réelles', 'Charges Théoriques', 'Différence Charges', 'TOTAL'].map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface-2 divide-y divide-border">
            {usersWithData.map((balance) => {
              const sharePercent = getRevenueSharePercentage(balance.userName);
              const metrics = computeRowMetrics(balance, totalRevenues, totalExpenses, sharePercent);

              return (
                <tr key={balance.userId} className="hover:bg-surface-3">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {balance.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sharePercent > 0 ? `${sharePercent}% des parts` : 'Pas de parts'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-400">
                      {formatCurrency(balance.totalRevenues)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(metrics.theoreticalRevenues)}
                    </span>
                    <div className="text-xs text-muted-foreground">({sharePercent}%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${metrics.revenueDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics.revenueDifference >= 0 ? '+' : ''}{formatCurrency(metrics.revenueDifference)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-red-400">
                      {formatCurrency(balance.totalExpenses)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(metrics.theoreticalExpenses)}
                    </span>
                    <div className="text-xs text-muted-foreground">(33.33%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${metrics.expenseDifference <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics.expenseDifference >= 0 ? '+' : ''}{formatCurrency(metrics.expenseDifference)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${metrics.finalTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics.finalTotal >= 0 ? '+' : ''}{formatCurrency(metrics.finalTotal)}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Summary row */}
            <tr className="bg-surface-2 border-t-2 border-border">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-foreground">TOTAL GLOBAL</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-green-400">
                  {formatCurrency(totalRevenues)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-muted-foreground">
                  {formatCurrency(totalRevenues)}
                </span>
                <div className="text-xs text-muted-foreground">(100%)</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-muted-foreground">0 €</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-red-400">
                  {formatCurrency(totalExpenses)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-muted-foreground">
                  {formatCurrency(totalExpenses)}
                </span>
                <div className="text-xs text-muted-foreground">(100%)</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-muted-foreground">0 €</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(usersWithData.reduce((sum, balance) => {
                    const sharePercent = getRevenueSharePercentage(balance.userName);
                    const metrics = computeRowMetrics(balance, totalRevenues, totalExpenses, sharePercent);
                    return sum + metrics.finalTotal;
                  }, 0))}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
