import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '../hooks/useAdminInvoices';
import type { PortalInvoice } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { validateInvoiceForm } from '../lib/invoiceFormValidation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateInvoiceInput) => Promise<{ id: string | null; error: string | null }>;
  /** Si fourni, le formulaire est en mode édition de ce brouillon. */
  editInvoice?: PortalInvoice | null;
  onUpdate?: (invoiceId: string, input: UpdateInvoiceInput) => Promise<{ error: string | null }>;
}

type Line = { label: string; amount: string };
type Inst = { label: string; amount: string; due_date: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

export function AdminInvoiceForm({ open, onOpenChange, onSubmit, editInvoice, onUpdate }: Props) {
  const [lines, setLines] = useState<Line[]>([{ label: '', amount: '' }]);
  const [isDeposit, setIsDeposit] = useState(false);
  const [vatRate, setVatRate] = useState('0');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [installments, setInstallments] = useState<Inst[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = !!editInvoice;

  const subtotal = useMemo(() => lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0), [lines]);
  const total = useMemo(() => subtotal * (1 + (parseFloat(vatRate) || 0) / 100), [subtotal, vatRate]);

  function reset() {
    setLines([{ label: '', amount: '' }]); setIsDeposit(false); setVatRate('0');
    setIssueDate(todayISO()); setDueDate(''); setNotes(''); setInstallments([]); setFormError(null);
  }

  // Pré-remplissage en mode édition (les acomptes ne sont pas éditables ici — cf. spec D4).
  useEffect(() => {
    if (open && editInvoice) {
      const items = (editInvoice.line_items as unknown as Array<{ label?: string; amount?: number }>) ?? [];
      setLines(items.length ? items.map((l) => ({ label: l.label ?? '', amount: l.amount != null ? String(l.amount) : '' })) : [{ label: '', amount: '' }]);
      setVatRate(String(editInvoice.vat_rate ?? 0));
      setIssueDate(editInvoice.issue_date ?? todayISO());
      setDueDate(editInvoice.due_date ?? '');
      setNotes(editInvoice.client_visible_notes ?? '');
      setInstallments([]);
      setIsDeposit(!!editInvoice.is_deposit);
      setFormError(null);
    }
  }, [open, editInvoice]);

  async function handleSubmit() {
    const numericLines = lines.map((l) => ({ label: l.label.trim(), amount: parseFloat(l.amount) || 0 }));
    const numericInst = installments
      .filter((i) => i.due_date)
      .map((i) => ({ amount: parseFloat(i.amount) || 0, due_date: i.due_date }));
    const validationError = validateInvoiceForm({
      lines: numericLines,
      vatRate: parseFloat(vatRate) || 0,
      issueDate,
      dueDate,
      installments: numericInst,
    });
    if (validationError) { setFormError(validationError); return; }

    const cleanLines = numericLines.filter((l) => l.label && l.amount > 0);
    const cleanInst = installments
      .filter((i) => parseFloat(i.amount) > 0 && i.due_date)
      .map((i) => ({ label: i.label.trim() || 'Acompte', amount: parseFloat(i.amount), due_date: i.due_date }));
    const amountSubtotal = cleanLines.reduce((s, l) => s + l.amount, 0);

    setSubmitting(true); setFormError(null);
    const result = isEdit && editInvoice && onUpdate
      ? await onUpdate(editInvoice.id, {
          amountSubtotal, vatRate: parseFloat(vatRate) || 0, lineItems: cleanLines,
          dueDate: dueDate || null, clientVisibleNotes: notes.trim() || null,
        })
      : await onSubmit({
          amountSubtotal, isDeposit, vatRate: parseFloat(vatRate) || 0, lineItems: cleanLines,
          issueDate, dueDate: dueDate || null, clientVisibleNotes: notes.trim() || null,
          installments: cleanInst,
        });
    setSubmitting(false);
    if (result.error) { setFormError(result.error); return; }
    reset(); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Modifier la facture' : 'Nouvelle facture'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Lignes</Label>
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Désignation" value={l.label}
                  onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <Input type="number" min="0" step="0.01" placeholder="€ HT" className="w-28" value={l.amount}
                  onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} />
                <Button type="button" variant="ghost" size="icon"
                  onClick={() => setLines(ls => ls.length > 1 ? ls.filter((_, j) => j !== i) : ls)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines(ls => [...ls, { label: '', amount: '' }])}>
              <Plus className="mr-1 h-4 w-4" /> Ligne
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>TVA (%)</Label><Input type="number" min="0" step="0.01" value={vatRate} onChange={e => setVatRate(e.target.value)} /></div>
            {!isEdit && (
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input type="checkbox" checked={isDeposit} onChange={e => setIsDeposit(e.target.checked)} /> Facture d'acompte
              </label>
            )}
            <div><Label>Émission</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} disabled={isEdit} /></div>
            <div><Label>Échéance</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div><Label>Note visible client</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
          {!isEdit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Acomptes / échéances (optionnel)</Label>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setInstallments(is => [...is, { label: '', amount: '', due_date: '' }])}>
                  <Plus className="mr-1 h-4 w-4" /> Échéance
                </Button>
              </div>
              {installments.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Libellé" value={it.label}
                    onChange={e => setInstallments(is => is.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                  <Input type="number" min="0" step="0.01" placeholder="€" className="w-24" value={it.amount}
                    onChange={e => setInstallments(is => is.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} />
                  <Input type="date" className="w-40" value={it.due_date}
                    onChange={e => setInstallments(is => is.map((x, j) => j === i ? { ...x, due_date: e.target.value } : x))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setInstallments(is => is.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
            Sous-total HT <strong>{subtotal.toFixed(2)} €</strong> · Total TTC <strong>{total.toFixed(2)} €</strong>
          </div>
          {formError && <p className="text-sm text-red-300">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {isEdit ? 'Enregistrer' : 'Créer (brouillon)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
