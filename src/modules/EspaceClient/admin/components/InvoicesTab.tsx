import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { InvoicePreviewDialog } from '@/modules/EspaceClient/shared/components';
import { AdminEmptyState, AdminSectionHeader } from '@/modules/EspaceClient/admin/components/kit';
import { useAdminInvoices, type AdminInvoice } from '../hooks/useAdminInvoices';
import { AdminInvoiceForm } from './AdminInvoiceForm';
import { CancelInvoiceDialog } from './CancelInvoiceDialog';
import { InvoiceCard } from './InvoiceCard';
import { getAdminSignedUrl } from '../lib/adminStorage';

const BUCKET = 'propulspace-documents';

export function InvoicesTab({ projectId, clientEmail }: { projectId: string; clientEmail: string | null }) {
  const { invoices, installmentsByInvoice, loading, error, createInvoice, updateInvoice, deleteInvoice, cancelInvoice, sendInvoice, remindInvoice } = useAdminInvoices(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<AdminInvoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<AdminInvoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminInvoice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onSend(inv: AdminInvoice) {
    setBusyId(inv.id); setActionError(null);
    const { error } = await sendInvoice(inv, clientEmail);
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onRemind(inv: AdminInvoice) {
    setBusyId(inv.id); setActionError(null);
    const { error } = await remindInvoice(inv, clientEmail);
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onDelete(inv: AdminInvoice) {
    if (!window.confirm(`Supprimer le brouillon ${inv.invoice_number ?? ''} ? Cette action est définitive.`)) return;
    setBusyId(inv.id); setActionError(null);
    const { error } = await deleteInvoice(inv.id);
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onPdf(inv: AdminInvoice) {
    if (!inv.pdf_url) return;
    const url = await getAdminSignedUrl(BUCKET, inv.pdf_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-5 py-2">
      <AdminSectionHeader
        title="Factures"
        subtitle={`${invoices.length} document${invoices.length > 1 ? 's' : ''} de facturation`}
        action={{ label: 'Nouvelle facture', icon: Plus, onClick: () => setFormOpen(true) }}
      />

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {actionError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

      {loading ? (
        // Squelettes au format des cartes facture (cf. .ps-skeleton du thème).
        <div className="space-y-4" aria-busy="true" aria-label="Chargement des factures">
          <div className="ps-skeleton h-28" />
          <div className="ps-skeleton h-28" />
          <div className="ps-skeleton h-28" />
        </div>
      ) : invoices.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="Aucune facture"
          body="Créez la première facture de ce client."
          action={
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-primary/85"
            >
              <Plus className="h-4 w-4" /> Nouvelle facture
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {invoices.map(inv => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              installments={installmentsByInvoice.get(inv.id) ?? []}
              clientEmail={clientEmail}
              busy={busyId === inv.id}
              onPreview={() => setPreviewInvoice(inv)}
              onPdf={() => onPdf(inv)}
              onEdit={() => setEditInvoice(inv)}
              onDelete={() => onDelete(inv)}
              onSend={() => onSend(inv)}
              onRemind={() => onRemind(inv)}
              onCancel={() => setCancelTarget(inv)}
            />
          ))}
        </div>
      )}

      <AdminInvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={createInvoice} />
      <AdminInvoiceForm
        open={!!editInvoice}
        editInvoice={editInvoice}
        onUpdate={updateInvoice}
        onSubmit={createInvoice}
        onOpenChange={(o) => { if (!o) setEditInvoice(null); }}
      />
      <InvoicePreviewDialog
        open={!!previewInvoice}
        invoice={previewInvoice}
        installments={previewInvoice ? installmentsByInvoice.get(previewInvoice.id) ?? [] : []}
        onOpenChange={(o) => { if (!o) setPreviewInvoice(null); }}
      />
      <CancelInvoiceDialog
        open={!!cancelTarget}
        invoiceNumber={cancelTarget?.invoice_number ?? null}
        onOpenChange={(o) => { if (!o) setCancelTarget(null); }}
        onConfirm={async (reason) => {
          if (!cancelTarget) return { error: 'Aucune facture' };
          const res = await cancelInvoice(cancelTarget.id, reason);
          if (!res.error) setCancelTarget(null);
          return res;
        }}
      />
    </div>
  );
}
