// =====================================================
// COMPOSANT: COMPTABILITÉ MENSUELLE - VERSION SIMPLIFIÉE MONO-UTILISATEUR
// =====================================================

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useRealtimeAccounting } from '../../hooks/useRealtimeAccounting';
import { MonthlyTransactionsModal } from './MonthlyTransactionsModal';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '../../utils';

interface MonthlyAccountingProps {
  selectedMonth?: Date;
  onMonthChange?: (month: Date) => void;
  onTransactionChange?: () => void;
}

export function MonthlyAccounting({ selectedMonth, onMonthChange, onTransactionChange }: MonthlyAccountingProps) {
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  
  // Utiliser le hook temps réel pour la synchronisation instantanée
  const {
    accounting_entries: entries,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useRealtimeAccounting(selectedMonth || new Date());

  const month = selectedMonth || new Date();

  // Navigation mois avec limites (début: Janvier 2026)
  const startDate = new Date(2026, 0, 1); // Janvier 2026

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(month);
    if (direction === 'prev') {
      const prevMonth = new Date(month);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      if (prevMonth < startDate) {
        toast.error('La comptabilité 2026 commence à partir de Janvier 2026');
        return;
      }
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      const nextMonth = new Date(month);
      const today = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      if (nextMonth > today) {
        toast.error('Navigation limitée à aujourd\'hui');
        return;
      }
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onMonthChange?.(newDate);
  };

  // Vérifier si on peut naviguer
  const canGoPrev = () => {
    const prevMonth = new Date(month);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth >= startDate;
  };

  const canGoNext = () => {
    const nextMonth = new Date(month);
    const today = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth <= today;
  };

  // Actions CRUD via le modal
  const handleAddTransaction = async (entry: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await addTransaction(entry);
    if (result.success) {
      setShowTransactionsModal(false);
      onTransactionChange?.();
    }
    return result;
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<AccountingEntry>) => {
    const result = await updateTransaction(id, updates);
    if (result.success) {
      setShowTransactionsModal(false);
      onTransactionChange?.();
    }
    return result;
  };

  const handleDeleteTransaction = async (id: string) => {
    const result = await deleteTransaction(id);
    if (result.success) {
      onTransactionChange?.();
    }
    return result;
  };

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

  return (
    <div className="space-y-6">
      {/* Header avec navigation et statistiques */}
      <div className="bg-surface-2 rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Comptabilité - {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              disabled={!canGoPrev()}
              className="p-2 rounded-lg border border-border hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              disabled={!canGoNext()}
              className="p-2 rounded-lg border border-border hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bouton pour gérer les transactions */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowTransactionsModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Gérer Transactions</span>
          </button>
        </div>
      </div>



      {/* Liste des accounting_entries du mois */}
      <div className="bg-surface-2 rounded-lg shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Transactions - {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center space-x-4">
              {/* Indicateur temps réel */}
              <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                <Eye className="h-3 w-3" />
                <span>Temps réel</span>
              </div>
              <button
                onClick={() => setShowTransactionsModal(true)}
                className="flex items-center space-x-2 bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <Settings className="h-4 w-4" />
                <span>Gérer</span>
              </button>
            </div>
          </div>
        </div>
        
        {entries && entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-1">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-2 divide-y divide-border">
                {entries.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-surface-3">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(transaction.entry_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'revenue'
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}>
                        {transaction.type === 'revenue' ? 'Revenu' : 'Dépense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'revenue' ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length > 10 && (
              <div className="px-6 py-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  {entries.length - 10} autre(s) transaction(s) - 
                  <button
                    onClick={() => setShowTransactionsModal(true)}
                    className="text-primary hover:text-primary/80 ml-1"
                  >
                    Voir tout
                  </button>
                </p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-12 w-12 text-muted-foreground" />}
            title="Aucune transaction"
            description={`Aucune transaction enregistrée pour ${month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`}
            onAction={() => setShowTransactionsModal(true)}
          />
        )}
      </div>

      {/* Modal pour gérer les transactions */}
      <MonthlyTransactionsModal
        open={showTransactionsModal}
        onClose={() => setShowTransactionsModal(false)}
        month={month}
        accounting_entries={entries as any}
        onAdd={handleAddTransaction}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
        loading={loading}
      />
    </div>
  );
} 