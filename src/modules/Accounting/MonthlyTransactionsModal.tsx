import { useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Plus, ReceiptText, X } from 'lucide-react';
import type { AccountingEntry } from '../../hooks/useMonthlyAccounting';
import { useMonthlyTransactions } from './hooks/useMonthlyTransactions';
import { useReceivables } from './hooks/useReceivables';
import { TransactionAddForm } from './components/monthly-transactions/TransactionAddForm';
import { TransactionItem } from './components/monthly-transactions/TransactionItem';
import { UnpaidSummary } from './components/UnpaidSummary';
import { DeleteConfirmDialog } from './components/monthly-transactions/DeleteConfirmDialog';
import { cn } from '../../lib/utils';

interface MonthlyTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  month: Date;
  accounting_entries: AccountingEntry[];
  onAdd: (entry: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, updates: Partial<AccountingEntry>) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function MonthlyTransactionsModal({
  open,
  onClose,
  month,
  accounting_entries,
  onAdd,
  onUpdate,
  onDelete,
  loading = false
}: MonthlyTransactionsModalProps) {
  const tx = useMonthlyTransactions({ month, onAdd, onUpdate, onDelete });
  const receivables = useReceivables();

  useEffect(() => {
    if (open) {
      tx.setShowAddForm(true);
    }
  }, [open, tx.setShowAddForm]);

  if (!open) return null;

  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const transactionCount = accounting_entries.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md">
      <button
        type="button"
        aria-label="Fermer le panneau des transactions"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.13),transparent_34%),linear-gradient(180deg,rgba(18,16,28,0.98),rgba(8,8,14,0.99))] shadow-[-28px_0_80px_rgba(0,0,0,0.42)]">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/15 text-violet-200">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Nouvelle transaction</h2>
                <p className="mt-1 text-sm capitalize text-violet-100/60">{monthLabel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-100/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-violet-100/50">Mois</p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">{monthLabel}</p>
            </div>
            <div className={cn(
              "rounded-xl border p-3",
              tx.formData.type === 'revenue'
                ? "border-emerald-400/15 bg-emerald-400/[0.07]"
                : "border-rose-400/15 bg-rose-400/[0.07]"
            )}>
              <p className="text-xs text-emerald-100/55">Type actif</p>
              <p className={cn(
                "mt-1 flex items-center gap-1 text-sm font-semibold",
                tx.formData.type === 'revenue' ? "text-emerald-300" : "text-rose-300"
              )}>
                {tx.formData.type === 'revenue' ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {tx.formData.type === 'revenue' ? 'Revenu' : 'Dépense'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-violet-100/50">Historique</p>
              <p className="mt-1 text-sm font-semibold text-white">{transactionCount} ligne{transactionCount > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <UnpaidSummary data={receivables} />

          {tx.showAddForm && (
            <TransactionAddForm
              formData={tx.formData}
              setFormData={tx.setFormData}
              onSubmit={tx.handleAdd}
              onCancel={() => { tx.setShowAddForm(false); tx.resetForm(); }}
              loading={loading || tx.isSubmitting}
            />
          )}

          {!tx.showAddForm && (
            <button
              onClick={() => tx.setShowAddForm(true)}
              className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_18px_48px_rgba(34,211,238,0.18)] transition hover:scale-[1.01]"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une transaction</span>
            </button>
          )}

          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Transactions du mois</h3>
              <p className="mt-1 text-xs text-violet-100/45">Edition et suppression rapides</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-violet-100/70">
              {transactionCount}
            </div>
          </div>

          <div className="space-y-3">
            {accounting_entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-8 text-center text-violet-100/55">
                <DollarSign className="mx-auto mb-3 h-10 w-10 text-violet-100/35" />
                <p className="text-sm font-medium">Aucune transaction pour ce mois</p>
                <p className="mt-1 text-xs">Ajoutez votre première ligne depuis le formulaire ci-dessus.</p>
              </div>
            ) : (
              accounting_entries.map((entry) => (
                <TransactionItem
                  key={entry.id}
                  entry={entry}
                  isEditing={tx.editingId === entry.id}
                  editData={tx.editData}
                  setEditData={tx.setEditData}
                  onEdit={tx.handleEdit}
                  onSaveEdit={tx.handleSaveEdit}
                  onCancelEdit={tx.handleCancelEdit}
                  onDelete={(id) => tx.setDeleteConfirmId(id)}
                  onSetStatus={tx.handleSetStatus}
                  loading={loading}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {tx.deleteConfirmId && (
        <DeleteConfirmDialog
          onConfirm={() => tx.handleDelete(tx.deleteConfirmId!)}
          onCancel={() => tx.setDeleteConfirmId(null)}
          loading={loading}
        />
      )}
    </div>
  );
}
