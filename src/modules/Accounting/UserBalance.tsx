import { AlertTriangle } from 'lucide-react';
import { useUserBalanceData } from './hooks/useUserBalanceData';
import { UserBalanceHeader } from './components/user-balance/UserBalanceHeader';
import { BalanceTable } from './components/user-balance/BalanceTable';
import { BalanceSummary } from './components/user-balance/BalanceSummary';

export function UserBalance() {
  const {
    usersWithData,
    totalRevenues,
    totalExpenses,
    loading,
    error,
    handleRefresh
  } = useUserBalanceData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (usersWithData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Aucune donnée trouvée</h3>
            <p className="text-yellow-600">
              Aucune entrée comptable avec des montants {'>'} 0€ n'a été trouvée dans la base de données.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserBalanceHeader onRefresh={handleRefresh} />
      <BalanceTable
        usersWithData={usersWithData}
        totalRevenues={totalRevenues}
        totalExpenses={totalExpenses}
      />
      <BalanceSummary
        totalRevenues={totalRevenues}
        totalExpenses={totalExpenses}
      />
    </div>
  );
}
