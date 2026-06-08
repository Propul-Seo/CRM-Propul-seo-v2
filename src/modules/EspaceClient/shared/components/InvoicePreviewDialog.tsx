import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';

// Aperçu « document » d'une facture, reconstruit depuis les données (A3 / E2).
// Fond blanc + couleurs fixes → rendu identique côté admin (thème sombre) et
// client (thème clair). Marche sur un brouillon, sans PDFMonkey.

const money = (a: string | number | null | undefined, c = 'EUR') => {
  const n = a == null ? 0 : typeof a === 'string' ? parseFloat(a) : a;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c || 'EUR' }).format(isNaN(n) ? 0 : n);
};
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard',
  cancelled: 'Annulée', refunded: 'Remboursée', partially_paid: 'Partiellement payée',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: PortalInvoice | null;
  installments?: PortalInstallment[];
}

export function InvoicePreviewDialog({ open, onOpenChange, invoice, installments = [] }: Props) {
  const snap = (invoice?.client_snapshot ?? {}) as Record<string, unknown>;
  const lines = (invoice?.line_items as unknown as Array<{ label?: string; amount?: number }>) ?? [];
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto p-0 sm:max-h-[85vh]">
        {invoice && (
          <div className="bg-white p-8 text-[13px] text-slate-800">
            {/* En-tête */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <p className="text-lg font-bold tracking-tight text-slate-900">Propul'SEO</p>
                <p className="text-[11px] text-slate-500">Facture</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{invoice.invoice_number ?? 'Brouillon'}</p>
                <p className="text-[11px] text-slate-500">{STATUS_LABELS[invoice.status] ?? invoice.status}</p>
              </div>
            </div>

            {/* Intitulé + client + dates */}
            <div className="grid grid-cols-2 gap-6 py-5">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Facturé à</p>
                {str(snap.company) && <p className="font-medium text-slate-900">{str(snap.company)}</p>}
                {str(snap.first_name) && <p>{str(snap.first_name)}</p>}
                {str(snap.email) && <p className="text-slate-500">{str(snap.email)}</p>}
                {str(snap.phone) && <p className="text-slate-500">{str(snap.phone)}</p>}
              </div>
              <div className="text-right">
                {invoice.title && <p className="mb-2 font-semibold text-slate-900">{invoice.title}</p>}
                <p><span className="text-slate-400">Émise le </span>{fmtDate(invoice.issue_date)}</p>
                <p><span className="text-slate-400">Échéance </span>{fmtDate(invoice.due_date)}</p>
              </div>
            </div>

            {/* Lignes */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 text-left font-semibold">Désignation</th>
                  <th className="py-2 text-right font-semibold">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2">{l.label ?? '—'}</td>
                    <td className="py-2 text-right tabular-nums">{money(l.amount ?? 0, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totaux */}
            <div className="mt-4 ml-auto w-56 space-y-1">
              <div className="flex justify-between text-slate-600"><span>Sous-total HT</span><span className="tabular-nums">{money(invoice.amount_subtotal, invoice.currency)}</span></div>
              <div className="flex justify-between text-slate-600"><span>TVA ({invoice.vat_rate}%)</span><span className="tabular-nums">{money(invoice.amount_vat, invoice.currency)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900"><span>Total TTC</span><span className="tabular-nums">{money(invoice.amount_total, invoice.currency)}</span></div>
            </div>

            {/* Échéances */}
            {installments.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Échéances</p>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {installments.map(inst => (
                    <li key={inst.id} className="flex items-center justify-between px-3 py-2">
                      <span>{inst.label || `Échéance ${inst.installment_number}`}<span className="ml-2 text-slate-400">{fmtDate(inst.due_date)}</span></span>
                      <span className="tabular-nums font-medium">{money(inst.amount, invoice.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Note client */}
            {invoice.client_visible_notes && (
              <p className="mt-6 border-t border-slate-200 pt-4 text-slate-600">{invoice.client_visible_notes}</p>
            )}

            <p className="mt-6 text-center text-[10px] text-slate-400">Aperçu — ce document n'a pas valeur de facture définitive tant qu'il n'est pas envoyé.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
