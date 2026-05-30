import React from 'react';
import { ArrowDownRight, ArrowUpRight, Save } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface TransactionAddFormProps {
  formData: {
    type: 'revenue' | 'expense';
    amount: string;
    description: string;
    category: string;
    entry_date: string;
    revenue_category: string;
    revenue_sous_categorie: string;
  };
  setFormData: (data: TransactionAddFormProps['formData']) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
}

const REVENUE_OPTIONS = [
  {
    label: 'Revenu client',
    category: 'services',
    revenue_category: '',
    revenue_sous_categorie: '',
  },
  {
    label: 'Site web',
    category: 'services',
    revenue_category: 'site_internet',
    revenue_sous_categorie: '',
  },
  {
    label: 'ERP',
    category: 'services',
    revenue_category: 'erp',
    revenue_sous_categorie: '',
  },
  {
    label: 'Autres sources',
    category: 'services',
    revenue_category: 'communication',
    revenue_sous_categorie: 'autre',
  },
] as const;

const EXPENSE_OPTIONS = [
  { label: 'Abonnement', category: 'subscription' },
  { label: 'Frais de services', category: 'services' },
  { label: 'Frais bureau', category: 'office' },
  { label: 'Marketing', category: 'marketing' },
  { label: 'Voyages', category: 'travel' },
  { label: 'Autre', category: 'other' },
] as const;

export function TransactionAddForm({ formData, setFormData, onSubmit, onCancel, loading }: TransactionAddFormProps) {
  const setType = (type: 'revenue' | 'expense') => {
    setFormData({
      ...formData,
      type,
      category: type === 'revenue' ? 'services' : 'subscription',
      revenue_category: '',
      revenue_sous_categorie: '',
    });
  };

  const selectRevenueOption = (option: typeof REVENUE_OPTIONS[number]) => {
    setFormData({
      ...formData,
      type: 'revenue',
      category: option.category,
      revenue_category: option.revenue_category,
      revenue_sous_categorie: option.revenue_sous_categorie,
    });
  };

  const selectExpenseOption = (option: typeof EXPENSE_OPTIONS[number]) => {
    setFormData({
      ...formData,
      type: 'expense',
      category: option.category,
      revenue_category: '',
      revenue_sous_categorie: '',
    });
  };

  const choiceButtonClass = (active: boolean) => cn(
    "min-h-[40px] rounded-full border px-3 text-sm font-semibold transition",
    active
      ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
      : "border-white/10 bg-white/[0.045] text-violet-100/72 hover:border-white/18 hover:bg-white/[0.075] hover:text-white"
  );

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-violet-100/65">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('revenue')}
                className={cn(
                  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition",
                  formData.type === 'revenue'
                    ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.035] text-violet-100/70 hover:bg-white/[0.06]"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Revenu
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition",
                  formData.type === 'expense'
                    ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.035] text-violet-100/70 hover:bg-white/[0.06]"
                )}
              >
                <ArrowDownRight className="h-4 w-4" />
                Dépense
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-violet-100/65">
              {formData.type === 'revenue' ? 'Nature du revenu' : 'Nature de la dépense'}
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.type === 'revenue' ? (
                REVENUE_OPTIONS.map((option) => {
                  const active = formData.revenue_category === option.revenue_category;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => selectRevenueOption(option)}
                      className={choiceButtonClass(active)}
                    >
                      {option.label}
                    </button>
                  );
                })
              ) : (
                EXPENSE_OPTIONS.map((option) => {
                  const active = formData.category === option.category;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => selectExpenseOption(option)}
                      className={choiceButtonClass(active)}
                    >
                      {option.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-violet-100/65">
                Montant (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="min-h-[42px] w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition placeholder:text-violet-100/35 focus:border-violet-300/35 focus:bg-white/[0.065]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-violet-100/65">
                Date
              </label>
              <input
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="min-h-[42px] w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition focus:border-violet-300/35 focus:bg-white/[0.065]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-violet-100/65">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[42px] w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none transition placeholder:text-violet-100/35 focus:border-violet-300/35 focus:bg-white/[0.065]"
              placeholder="Description de la transaction"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-violet-100/45">Entrée enregistrée sur le mois sélectionné.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-violet-100/75 transition hover:bg-white/[0.08]"
            >
              Annuler
            </button>
          <button
            type="submit"
            disabled={loading}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 text-sm font-bold text-slate-950 shadow-[0_16px_36px_rgba(34,211,238,0.16)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
              <span>Ajouter</span>
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}
