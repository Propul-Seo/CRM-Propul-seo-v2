import { useState } from 'react';
import { Plus, Send, Bell, Loader2, FileText, Pencil, Trash2, Ban, Eye } from 'lucide-react';
import { StatusBadge, InvoicePreviewDialog } from '@/modules/EspaceClient/shared/components';
import { AdminSectionHeader, AdminCard, AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
import { useAdminInvoices, type AdminInvoice } from '../hooks/useAdminInvoices';
import { AdminInvoiceForm } from './AdminInvoiceForm';
import { CancelInvoiceDialog } from './CancelInvoiceDialog';
import { getAdminSignedUrl } from '../lib/adminStorage';

const BUCKET = 'propulspace-documents';
// Comportement SP3 d'origine : relance/annulation sur sent|overdue uniquement.
// (partially_paid exclu — l'avoir formel est reporté, cf. cycle de vie facture SP3.)
const REMINDABLE = new Set(['sent', 'overdue']);

const money = (a: string | number, c = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c }).format(typeof a === 'string' ? parseFloat(a) : a);

// Petit bouton d'action en icône (thème CRM sombre, hover violet).
function IconAction({
  icon: Icon, title, onClick, disabled, tone = 'default',
}: {
  icon: typeof Eye; title: string; onClick: () => void; disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  const toneCls =
    tone === 'danger'
      ? 'text-muted-foreground hover:bg-red-500/10 hover:text-red-300'
      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40 ${toneCls}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

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
    <div className="py-2">
      <AdminSectionHeader
        title={`${invoices.length} facture${invoices.length > 1 ? 's' : ''}`}
        action={{ label: 'Nouvelle facture', icon: Plus, onClick: () => setFormOpen(true) }}
      />

      {loading && (
        <div className="py-6 text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…</div>
      )}
      {error && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {actionError && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

      {!loading && invoices.length === 0 && (
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
      )}

      {!loading && invoices.length > 0 && (
        <div className="space-y-2.5">
          {invoices.map(inv => {
            const busy = busyId === inv.id;
            const isDraft = inv.status === 'draft';
            const canRemind = REMINDABLE.has(inv.status);
            const canCancel = inv.status === 'sent' || inv.status === 'overdue';
            return (
              <AdminCard key={inv.id} className="transition-colors hover:border-primary/40">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* Identité : n° + titre + date */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{inv.invoice_number ?? 'Brouillon'}</p>
                      {inv.is_deposit && (
                        <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">Acompte</span>
                      )}
                    </div>
                    {inv.title && <p className="truncate text-xs font-medium text-foreground/70">{inv.title}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Émise le {new Date(inv.issue_date).toLocaleDateString('fr-FR')}</p>
                  </div>

                  {/* Montant + statut */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-lg font-bold tabular-nums text-foreground">{money(inv.amount_total, inv.currency)}</span>
                    <StatusBadge status={inv.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 border-l border-border pl-3">
                    <IconAction icon={Eye} title="Aperçu" onClick={() => setPreviewInvoice(inv)} disabled={busy} />
                    {inv.pdf_url && <IconAction icon={FileText} title="Ouvrir le PDF" onClick={() => onPdf(inv)} disabled={busy} />}

                    {isDraft && (
                      <>
                        <IconAction icon={Pencil} title="Modifier" onClick={() => setEditInvoice(inv)} disabled={busy} />
                        <IconAction icon={Trash2} title="Supprimer" onClick={() => onDelete(inv)} disabled={busy} tone="danger" />
                        <button
                          type="button"
                          onClick={() => onSend(inv)}
                          disabled={busy}
                          className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5" />Envoyer</>}
                        </button>
                      </>
                    )}

                    {canRemind && (
                      <button
                        type="button"
                        onClick={() => onRemind(inv)}
                        disabled={busy || !clientEmail}
                        title={!clientEmail ? 'Email client requis' : undefined}
                        className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-3 px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Bell className="h-3.5 w-3.5" />Relancer</>}
                      </button>
                    )}

                    {canCancel && (
                      <IconAction icon={Ban} title="Annuler la facture" onClick={() => setCancelTarget(inv)} disabled={busy} tone="danger" />
                    )}
                  </div>
                </div>

                {inv.status === 'cancelled' && inv.cancellation_reason && (
                  <p className="mt-2.5 rounded-md bg-surface-3 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">Motif d'annulation :</span> {inv.cancellation_reason}
                  </p>
                )}
              </AdminCard>
            );
          })}
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
