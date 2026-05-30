import {
  Edit,
  Trash2,
  Save,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../../utils';
import { RevenueAllocationEditor } from '../RevenueAllocationEditor';
import type { AccountingEntry } from '../../../../hooks/useMonthlyAccounting';

interface TransactionItemProps {
  entry: AccountingEntry;
  isEditing: boolean;
  editData: Partial<AccountingEntry & { amount: string }>;
  setEditData: (data: Partial<AccountingEntry & { amount: string }>) => void;
  onEdit: (entry: AccountingEntry) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export function TransactionItem({
  entry,
  isEditing,
  editData,
  setEditData,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  loading
}: TransactionItemProps) {
  return (
    <div
      className={`p-4 border rounded-lg ${
        entry.type === 'revenue'
          ? 'border-green-800 bg-green-500/10'
          : 'border-red-800 bg-red-500/10'
      }`}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value as 'revenue' | 'expense' })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground"
              >
                <option value="revenue">Revenu</option>
                <option value="expense">Dépense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Montant (€)</label>
              <input
                type="number"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Catégorie</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground"
              >
                <option value="services">Services</option>
                <option value="products">Produits</option>
                <option value="marketing">Marketing</option>
                <option value="office">Bureau</option>
                <option value="travel">Voyages</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={editData.entry_date}
                onChange={(e) => setEditData({ ...editData, entry_date: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground"
              />
            </div>

            {editData.type === 'revenue' && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Type de prestation</label>
                <select
                  value={editData.revenue_category || ''}
                  onChange={(e) => setEditData({ ...editData, revenue_category: e.target.value || undefined, revenue_sous_categorie: undefined })}
                  className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground"
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="site_internet">Site Internet</option>
                  <option value="erp">ERP</option>
                  <option value="communication">Autres sources</option>
                </select>
              </div>
            )}

            {editData.type === 'revenue' && editData.revenue_category === 'communication' && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Sous-catégorie</label>
                <select
                  value={editData.revenue_sous_categorie || ''}
                  onChange={(e) => setEditData({ ...editData, revenue_sous_categorie: e.target.value || undefined })}
                  className="w-full p-2 border border-border rounded-md bg-surface-2 text-foreground"
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="chatbot">Chatbot</option>
                  <option value="cm">Community Management</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onSaveEdit}
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Sauvegarder</span>
            </button>
            <button
              onClick={onCancelEdit}
              className="bg-surface-3 text-foreground px-4 py-2 rounded-lg hover:bg-surface-3"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                {entry.type === 'revenue' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">
                  {entry.type === 'revenue' ? '+' : '-'}{formatCurrency(entry.amount)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{entry.category}</span>
            </div>
            <p className="text-foreground font-medium mt-1">{entry.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(entry.entry_date)}</span>
              </span>
            </div>
            {entry.type === 'revenue' && (
              <RevenueAllocationEditor
                entryId={entry.id}
                entryAmount={entry.amount}
              />
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(entry)}
              className="text-primary hover:text-primary/80"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
