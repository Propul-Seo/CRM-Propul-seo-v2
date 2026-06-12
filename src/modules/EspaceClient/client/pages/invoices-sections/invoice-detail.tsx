import { ArrowRight, Download, Eye, Loader2, ShieldCheck } from 'lucide-react';
import { InvoiceTimeline } from '@/modules/EspaceClient/client/components/InvoiceTimeline';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { formatDate, formatLongDate, money, num, UNPAID } from './invoice-format';
import { StatutFacture } from './invoice-status';
import { InvoicePayments } from './invoice-payments';

// Carte de détail riche en zone basse : LA surface élevée de l'écran.
// PDF toujours accessible, réassurance ShieldCheck, CTA « Régler » → Stripe.

interface InvoiceDetailProps {
  invoice: PortalInvoice;
  installments: PortalInstallment[];
  payingId: string | null;
  onPay: (target: 'invoice' | 'installment', target_id: string) => void;
  onDownload: (inv: PortalInvoice) => void;
  onPreview: () => void;
}

const LINK_CLS =
  'group -my-2 inline-flex min-h-[44px] items-center gap-1.5 py-2 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]';

export function InvoiceDetail({ invoice, installments, payingId, onPay, onDownload, onPreview }: InvoiceDetailProps) {
  const { previewMode } = usePortal();
  const currency = invoice.currency || 'EUR';
  const fmtMoney = (a: string | number) => money(a, currency);

  const total = num(invoice.amount_total);
  const paidAmount = installments.filter(i => i.status === 'paid').reduce((s, i) => s + num(i.amount), 0);
  const remaining = invoice.status === 'paid' ? 0 : Math.max(0, total - paidAmount);

  const isCancelled = invoice.status === 'cancelled';
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';
  const awaitingPayment = UNPAID.has(invoice.status);

  // On privilégie le paiement échéance par échéance dès qu'il existe des
  // installments (garde anti-trop-perçu : pas de "facture entière" si elle est
  // découpée en acomptes).
  const canPayWhole = !previewMode && (invoice.status === 'sent' || invoice.status === 'overdue') && installments.length === 0;

  return (
    <section className="mt-4" aria-label="Détail de la facture sélectionnée">
      <div className="ps-surface p-5">
        {/* Entête : identité de la facture + montant */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p className="ps-num text-[12px] text-[var(--ps-fg-muted)] [font-family:var(--ps-font-mono)]">
              {invoice.invoice_number ?? 'Brouillon'}
            </p>
            <h2 className="ps-h3 mt-1 text-[var(--ps-fg)]">{invoice.title ?? 'Facture'}</h2>
            <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-[var(--ps-fg-secondary)]">
              <div className="flex gap-1.5">
                <dt>Émise le</dt>
                <dd className="ps-num font-medium text-[var(--ps-fg)]">{formatLongDate(invoice.issue_date)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Échéance</dt>
                <dd className={`ps-num font-medium ${isOverdue ? 'text-[var(--ps-danger-text)]' : 'text-[var(--ps-fg)]'}`}>
                  {formatLongDate(invoice.due_date)}
                </dd>
              </div>
              {invoice.paid_at && (
                <div className="flex gap-1.5">
                  <dt>Payée le</dt>
                  <dd className="ps-num font-medium text-[var(--ps-fg)]">{formatLongDate(invoice.paid_at)}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="ps-tiny">Montant total TTC</p>
            <p className="ps-metric ps-num mt-1 text-[var(--ps-fg)]">{fmtMoney(invoice.amount_total)}</p>
            <p className="mt-1.5 sm:flex sm:justify-end">
              <StatutFacture status={invoice.status} />
            </p>
          </div>
        </div>

        {/* Ligne de vie du paiement */}
        {!isCancelled && (
          <div className="mt-4 border-t border-[var(--ps-border-soft)] pt-3.5">
            <p className="ps-tiny mb-3">Ligne de vie du paiement</p>
            <InvoiceTimeline
              issueDate={invoice.issue_date}
              installments={installments}
              invoiceStatus={invoice.status}
              paidAt={invoice.paid_at}
              formatDate={formatDate}
              formatMoney={fmtMoney}
            />
          </div>
        )}

        {/* Progression encaissée + récap + échéances payables */}
        <InvoicePayments
          invoice={invoice}
          installments={installments}
          payingId={payingId}
          onPay={onPay}
          fmtMoney={fmtMoney}
          paidAmount={paidAmount}
          remaining={remaining}
        />

        {/* Pied : réassurance + documents + règlement */}
        <div className="mt-4 flex flex-col gap-4 border-t border-[var(--ps-border-soft)] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {awaitingPayment ? (
              <p className="ps-small flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)]" strokeWidth={2} />
                Règlement sécurisé par carte ou virement, reçu envoyé automatiquement.
              </p>
            ) : (
              <p className="ps-small">
                {isPaid && invoice.paid_at
                  ? <>Réglée le <span className="ps-num font-medium text-[var(--ps-fg)]">{formatLongDate(invoice.paid_at)}</span>. Merci pour votre confiance.</>
                  : 'Aucun règlement attendu pour cette facture.'}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-5">
              <button type="button" onClick={onPreview} className={LINK_CLS}>
                <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                Aperçu de la facture
              </button>
              {invoice.pdf_url && (
                <button type="button" onClick={() => onDownload(invoice)} className={LINK_CLS}>
                  <Download className="h-3.5 w-3.5" strokeWidth={2} />
                  Télécharger le PDF
                </button>
              )}
            </div>
          </div>
          {canPayWhole && (
            <button
              type="button"
              onClick={() => onPay('invoice', invoice.id)}
              disabled={payingId === invoice.id}
              className="group ps-tap inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] disabled:opacity-60 sm:w-auto"
            >
              {payingId === invoice.id
                ? <><Loader2 className="h-4 w-4 animate-spin" />Redirection…</>
                : <>
                    Régler {fmtMoney(remaining)}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
                  </>}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
