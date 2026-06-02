import { useState } from 'react';
import { toast } from 'sonner';
import type { AccountingEntry } from '../../../hooks/useMonthlyAccounting';
import { paymentStatusUpdates } from '../lib/paymentStatus';

interface UseMonthlyTransactionsParams {
  month: Date;
  onAdd: (entry: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, updates: Partial<AccountingEntry>) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function useMonthlyTransactions({ month, onAdd, onUpdate, onDelete }: UseMonthlyTransactionsParams) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'revenue' as 'revenue' | 'expense',
    amount: '',
    description: '',
    category: 'services',
    entry_date: month.toISOString().split('T')[0],
    revenue_category: '',
    revenue_sous_categorie: '',
    payment_status: 'paid' as 'paid' | 'pending',
    due_date: '',
    project_id: ''
  });
  const [editData, setEditData] = useState<Partial<AccountingEntry & { amount: string }>>({});

  const resetForm = () => {
    setFormData({
      type: 'revenue',
      amount: '',
      description: '',
      category: 'services',
      entry_date: month.toISOString().split('T')[0],
      revenue_category: '',
      revenue_sous_categorie: '',
      payment_status: 'paid',
      due_date: '',
      project_id: ''
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.amount || !formData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Le statut de paiement ne concerne que les revenus ; une dépense est toujours « payée ».
    const paymentStatus: 'paid' | 'pending' = formData.type === 'revenue' ? formData.payment_status : 'paid';
    const dueDate = paymentStatus === 'pending' ? (formData.due_date || null) : null;
    const paymentDate = paymentStatus === 'paid' ? formData.entry_date : null;

    setIsSubmitting(true);
    try {
      const result = await onAdd({
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        entry_date: formData.entry_date,
        month_key: formData.entry_date.slice(0, 7),
        responsible_user_id: null,
        responsible_user_name: null,
        revenue_category: formData.revenue_category || null,
        revenue_sous_categorie: formData.revenue_sous_categorie || null,
        payment_status: paymentStatus,
        due_date: dueDate,
        payment_date: paymentDate,
        project_id: formData.type === 'revenue' ? (formData.project_id || null) : null
      });

      if (result.success) {
        setShowAddForm(false);
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (transaction: AccountingEntry) => {
    setEditingId(transaction.id);
    setEditData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category || 'services',
      entry_date: transaction.entry_date,
      revenue_category: transaction.revenue_category ?? undefined,
      revenue_sous_categorie: transaction.revenue_sous_categorie ?? undefined,
      project_id: transaction.project_id ?? null
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData.amount || !editData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const result = await onUpdate(editingId, {
      type: editData.type as 'revenue' | 'expense',
      amount: parseFloat(editData.amount),
      description: editData.description,
      category: editData.category,
      entry_date: editData.entry_date,
      revenue_category: editData.revenue_category || null,
      revenue_sous_categorie: editData.revenue_sous_categorie || null,
      project_id: editData.type === 'revenue' ? (editData.project_id || null) : null
    });

    if (result.success) {
      setEditingId(null);
      setEditData({});
    }
  };

  const handleDelete = async (id: string) => {
    const result = await onDelete(id);
    if (result.success) {
      setDeleteConfirmId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSetStatus = async (
    entry: AccountingEntry,
    status: 'paid' | 'pending',
    dueDate?: string | null,
  ) => {
    await onUpdate(entry.id, paymentStatusUpdates(status, dueDate));
  };

  return {
    showAddForm,
    setShowAddForm,
    editingId,
    deleteConfirmId,
    setDeleteConfirmId,
    formData,
    setFormData,
    editData,
    setEditData,
    isSubmitting,
    resetForm,
    handleAdd,
    handleEdit,
    handleSaveEdit,
    handleDelete,
    handleCancelEdit,
    handleSetStatus
  };
}
