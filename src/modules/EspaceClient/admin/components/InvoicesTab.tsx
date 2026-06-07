import { useState } from 'react';
import { Plus, Send, Bell, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, EmptyState } from '@/modules/EspaceClient/shared/components';
import { useAdminInvoices } from '../hooks/useAdminInvoices';
import { AdminInvoiceForm } from './AdminInvoiceForm';
import { getAdminSignedUrl } from '../lib/adminStorage';
import type { PortalInvoice } from '@/modules/EspaceClient/client/hooks/usePortalData';

const BUCKET = 'propulspace-documents';
const money = (a: string | number, c = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c }).format(typeof a === 'string' ? parseFloat(a) : a);

export function InvoicesTab({ projectId, clientEmail }: { projectId: string; clientEmail: string | null }) {
  const { invoices, loading, error, createInvoice, sendInvoice, remindInvoice } = useAdminInvoices(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onSend(inv: PortalInvoice) {
    setBusyId(inv.id); setActionError(null);
    const { error } = await sendInvoice(inv, clientEmail);
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onRemind(inv: PortalInvoice) {
    setBusyId(inv.id); setActionError(null);
    const { error } = await remindInvoice(inv, clientEmail);
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onPdf(inv: PortalInvoice) {
    if (!inv.pdf_url) return;
    const url = await getAdminSignedUrl(BUCKET, inv.pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground/80">{`${invoices.length} facture${invoices.length > 1 ? 's' : ''}`}</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="mr-1 h-4 w-4" /> Nouvelle facture</Button>
      </div>
      {loading && <div className="py-6 text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…</div>}
      {error && <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {actionError && <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}
      {!loading && invoices.length === 0 && <EmptyState icon={FileText} title="Aucune facture" body="Créez la première facture de ce client." />}
      <ul className="divide-y divide-border">
        {invoices.map(inv => (
          <li key={inv.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{inv.invoice_number}{inv.is_deposit && <span className="ml-2 text-xs text-muted-foreground">Acompte</span>}</p>
              <p className="text-xs text-muted-foreground">Émise le {new Date(inv.issue_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <span className="text-sm font-bold">{money(inv.amount_total, inv.currency)}</span>
            <StatusBadge status={inv.status} />
            {inv.pdf_url && <Button variant="ghost" size="icon" onClick={() => onPdf(inv)} title="PDF"><FileText className="h-4 w-4" /></Button>}
            {inv.status === 'draft' && (
              <Button size="sm" onClick={() => onSend(inv)} disabled={busyId === inv.id}>
                {busyId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1 h-4 w-4" />Envoyer</>}
              </Button>
            )}
            {(inv.status === 'sent' || inv.status === 'overdue') && (
              <Button variant="outline" size="sm" onClick={() => onRemind(inv)} disabled={busyId === inv.id || !clientEmail}>
                {busyId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bell className="mr-1 h-4 w-4" />Relancer</>}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <AdminInvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={createInvoice} />
    </div>
  );
}
