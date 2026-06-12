import { Eye, FileText, Pencil, Trash2, Bell, Ban, Send, Loader2 } from 'lucide-react';
import { StatusBadge, Badge } from '@/modules/EspaceClient/shared/components';
import type { AdminInvoice } from '../hooks/useAdminInvoices';
import type { PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';

const money = (a: string | number, c = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c }).format(typeof a === 'string' ? parseFloat(a) : a);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');
// Comportement SP3 d'origine : relance/annulation sur sent|overdue uniquement.
// (partially_paid exclu — l'avoir formel est reporté, cf. cycle de vie facture SP3.)
const REMINDABLE = new Set(['sent', 'overdue']);

function Ghost({ icon: Icon, label, onClick, disabled, tone = 'default' }: {
  icon: typeof Eye; label: string; onClick: () => void; disabled?: boolean; tone?: 'default' | 'danger';
}) {
  const hover = tone === 'danger' ? 'hover:bg-red-500/10 hover:text-red-300' : 'hover:bg-surface-3 hover:text-foreground';
  return (
    <button
      type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} disabled={disabled} title={label} aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors disabled:opacity-40 ${hover}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Schedule({ items }: { items: PortalInstallment[] }) {
  return (
    <div className="mt-4 rounded-lg bg-surface-1 p-3.5">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Échéancier</p>
      <ul className="space-y-1">
        {items.map(it => (
          <li key={it.id} className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm">
            <div className="min-w-0">
              <span className="font-medium text-foreground">{it.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">échéance {fmtDate(it.due_date)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums text-foreground/70">{money(it.amount)}</span>
              <StatusBadge status={it.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  invoice: AdminInvoice;
  installments: PortalInstallment[];
  clientEmail: string | null;
  busy: boolean;
  onPreview: () => void;
  onPdf: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSend: () => void;
  onRemind: () => void;
  onCancel: () => void;
}

// Carte facture (DA Atelier) : en-tête réf + montant, échéancier, actions selon statut.
export function InvoiceCard({
  invoice, installments, clientEmail, busy,
  onPreview, onPdf, onEdit, onDelete, onSend, onRemind, onCancel,
}: Props) {
  const isDraft = invoice.status === 'draft';
  const canRemind = REMINDABLE.has(invoice.status);
  const canCancel = invoice.status === 'sent' || invoice.status === 'overdue';
  const ref = invoice.invoice_number ?? 'Brouillon';

  return (
    <article
      onClick={onPreview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(); } }}
      className="cursor-pointer rounded-xl border border-border bg-surface-2 p-4 shadow-glow-sm transition-colors hover:border-primary/40 hover:bg-surface-3/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ref}</span>
            {invoice.is_deposit && <Badge tone="violet">Acompte</Badge>}
          </div>
          {invoice.title && <h3 className="truncate text-[15px] font-semibold text-foreground">{invoice.title}</h3>}
          <p className="text-xs text-muted-foreground">Émise le {fmtDate(invoice.issue_date)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Montant fort : Space Grotesk + tabular-nums via la classe thème .ps-metric. */}
          <span className="ps-metric text-foreground">{money(invoice.amount_total, invoice.currency)}</span>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {installments.length > 0 && <Schedule items={installments} />}

      {invoice.status === 'cancelled' && invoice.cancellation_reason && (
        <p className="mt-3 rounded-md bg-surface-1 px-2.5 py-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Motif d'annulation :</span> {invoice.cancellation_reason}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <div className="flex items-center gap-2">
          {isDraft && (
            <button
              type="button" onClick={(e) => { e.stopPropagation(); onSend(); }} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Envoyer
            </button>
          )}
          {canRemind && (
            <button
              type="button" onClick={(e) => { e.stopPropagation(); onRemind(); }} disabled={busy || !clientEmail}
              title={!clientEmail ? 'Email client requis' : undefined}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />} Relancer
            </button>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {invoice.pdf_url && <Ghost icon={FileText} label="Ouvrir le PDF" onClick={onPdf} disabled={busy} />}
          {isDraft && <Ghost icon={Pencil} label="Modifier" onClick={onEdit} disabled={busy} />}
          {isDraft && <Ghost icon={Trash2} label="Supprimer" onClick={onDelete} disabled={busy} tone="danger" />}
          {canCancel && <Ghost icon={Ban} label="Annuler la facture" onClick={onCancel} disabled={busy} tone="danger" />}
        </div>
      </div>
    </article>
  );
}
