import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { formatCurrency } from '../../../utils';
import { getCategoryLabel, getCategoryColorClasses, getSousCategorieLabel } from '../constants';
import { useRevenueAllocations, type RevenueAllocation } from '../hooks/useRevenueAllocations';

interface AllocationLine {
  revenue_category: string;
  revenue_sous_categorie: string;
  amount: string;
}

const emptyLine = (): AllocationLine => ({
  revenue_category: 'site_internet',
  revenue_sous_categorie: '',
  amount: '',
});

interface RevenueAllocationEditorProps {
  entryId: string;
  entryAmount: number;
  readOnly?: boolean;
}

export function RevenueAllocationEditor({ entryId, entryAmount, readOnly }: RevenueAllocationEditorProps) {
  const { allocations, loading, replaceAllocations } = useRevenueAllocations(entryId);
  const [editing, setEditing] = useState(false);
  const [lines, setLines] = useState<AllocationLine[]>([]);

  const startEditing = () => {
    if (allocations.length > 0) {
      setLines(allocations.map((a) => ({
        revenue_category: a.revenue_category,
        revenue_sous_categorie: a.revenue_sous_categorie || '',
        amount: a.amount.toString(),
      })));
    } else {
      setLines([emptyLine()]);
    }
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setLines([]);
  };

  const addLine = () => {
    setLines([...lines, emptyLine()]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof AllocationLine, value: string) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'revenue_category' && value !== 'communication') {
      updated[index].revenue_sous_categorie = '';
    }
    setLines(updated);
  };

  const allocatedTotal = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const remaining = entryAmount - allocatedTotal;

  const handleSave = async () => {
    const validLines = lines.filter((l) => l.revenue_category && parseFloat(l.amount) > 0);
    if (validLines.length === 0) {
      return;
    }

    const total = validLines.reduce((s, l) => s + parseFloat(l.amount), 0);
    if (Math.abs(total - entryAmount) > 0.01) {
      // Allow saving even if not fully allocated
    }

    await replaceAllocations(
      validLines.map((l) => ({
        revenue_category: l.revenue_category,
        revenue_sous_categorie: l.revenue_sous_categorie || null,
        amount: parseFloat(l.amount),
      }))
    );
    setEditing(false);
  };

  // Read-only display
  if (!editing) {
    return (
      <div className="mt-2">
        {allocations.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {allocations.map((a) => (
                <Badge key={a.id} className={getCategoryColorClasses(a.revenue_category)}>
                  {getCategoryLabel(a.revenue_category)}
                  {a.revenue_sous_categorie && ` - ${getSousCategorieLabel(a.revenue_sous_categorie)}`}
                  {': '}{formatCurrency(a.amount)}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Aucune répartition</span>
        )}
        {!readOnly && (
          <button
            onClick={startEditing}
            className="mt-1.5 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            {allocations.length > 0 ? 'Modifier la répartition' : 'Répartir le revenu'}
          </button>
        )}
      </div>
    );
  }

  // Editing mode
  return (
    <div className="mt-3 p-3 border border-border/50 rounded-lg bg-surface-2/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Répartition du revenu</span>
        <span className={`text-xs font-medium ${Math.abs(remaining) < 0.01 ? 'text-emerald-400' : remaining > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
          Reste: {formatCurrency(Math.max(0, remaining))} / {formatCurrency(entryAmount)}
        </span>
      </div>

      {lines.map((line, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Catégorie</label>
            <select
              value={line.revenue_category}
              onChange={(e) => updateLine(i, 'revenue_category', e.target.value)}
              className="w-full p-1.5 text-sm border border-border rounded-md bg-surface-2 text-foreground"
            >
              <option value="site_internet">Site Internet</option>
              <option value="erp">ERP</option>
              <option value="communication">Autres sources</option>
            </select>
          </div>

          {line.revenue_category === 'communication' && (
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Sous-cat.</label>
              <select
                value={line.revenue_sous_categorie}
                onChange={(e) => updateLine(i, 'revenue_sous_categorie', e.target.value)}
                className="w-full p-1.5 text-sm border border-border rounded-md bg-surface-2 text-foreground"
              >
                <option value="">--</option>
                <option value="chatbot">Chatbot</option>
                <option value="cm">CM</option>
                <option value="newsletter">Newsletter</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          )}

          <div className="w-28">
            <label className="block text-xs text-muted-foreground mb-1">Montant €</label>
            <input
              type="number"
              step="0.01"
              value={line.amount}
              onChange={(e) => updateLine(i, 'amount', e.target.value)}
              className="w-full p-1.5 text-sm border border-border rounded-md bg-surface-2 text-foreground"
              placeholder="0.00"
            />
          </div>

          <button
            onClick={() => removeLine(i)}
            className="p-1.5 text-rose-400 hover:text-rose-300 mb-0.5"
            disabled={lines.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={addLine}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Ajouter une ligne
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={cancelEditing}
            className="text-xs px-3 py-1.5 rounded-md bg-surface-3 text-foreground hover:bg-surface-3/80 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading || allocatedTotal <= 0}
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
          >
            <Save className="h-3 w-3" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
