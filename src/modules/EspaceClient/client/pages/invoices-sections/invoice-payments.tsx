import type { CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { PortalInvoice, PortalInstallment } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { formatDate, num, paidPercent } from './invoice-format';
import { StatutFacture } from './invoice-status';

// Volet « règlements » de la carte de détail : progression encaissée, récap
// chiffré et échéances payables une à une (garde anti-trop-perçu côté page).

interface InvoicePaymentsProps {
  invoice: PortalInvoice;
  installments: PortalInstallment[];
  payingId: string | null;
  onPay: (target: 'invoice' | 'installment', target_id: string) => void;
  fmtMoney: (amount: string | number) => string;
  paidAmount: number;
  remaining: number;
}

export function InvoicePayments({
  invoice, installments, payingId, onPay, fmtMoney, paidAmount, remaining,
}: InvoicePaymentsProps) {
  const { previewMode } = usePortal();
  const pct = paidPercent(invoice, installments);
  const total = num(invoice.amount_total);
  const isPaid = invoice.status === 'paid';
  const isCancelled = invoice.status === 'cancelled';
  const isRefunded = invoice.status === 'refunded';

  return (
    <>
      {/* Progression encaissée */}
      {!isCancelled && total > 0 && (
        <div className="mt-7">
          <div className="flex items-baseline justify-between gap-4">
            <p className="ps-tiny">Encaissé sur total</p>
            <p className="ps-num text-[13px] font-semibold text-[var(--ps-fg)]">
              {fmtMoney(isPaid ? total : paidAmount)} / {fmtMoney(total)}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
            <div
              className={`ps-progress-fill h-full rounded-full ${pct >= 100 ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-primary)]'}`}
              style={{ '--ps-bar-w': `${pct}%` } as CSSProperties}
            />
          </div>
          <p className="ps-num mt-1.5 text-right text-[12px] text-[var(--ps-fg-muted)]">
            {pct}% encaissé{pct < 100 ? ` · ${100 - pct}% restant` : ''}
          </p>
        </div>
      )}

      {/* Récap chiffré */}
      <div className="mt-7 overflow-hidden rounded-[var(--ps-radius-input)] border border-[var(--ps-border-soft)]">
        <RecapRow label="Montant TTC" amount={fmtMoney(invoice.amount_total)} />
        {paidAmount > 0 && !isPaid && (
          <RecapRow label="Déjà réglé" amount={`− ${fmtMoney(paidAmount)}`} tone="credit" />
        )}
        <div className="flex items-center justify-between bg-[var(--ps-primary-subtle)] px-4 py-3">
          <span className="text-[13.5px] font-semibold text-[var(--ps-primary-text)]">
            {isPaid ? 'Payée intégralement' : isCancelled ? 'Facture annulée' : isRefunded ? 'Facture remboursée' : 'Restant dû'}
          </span>
          <span className="ps-num text-[14px] font-semibold text-[var(--ps-primary-text)]">
            {isPaid ? fmtMoney(0) : isCancelled || isRefunded ? '—' : fmtMoney(remaining)}
          </span>
        </div>
      </div>

      {/* Échéances individuelles avec paiement */}
      {installments.length > 0 && (
        <div className="mt-6">
          <p className="ps-tiny mb-2.5">Échéances</p>
          <ul className="divide-y divide-[var(--ps-border-soft)] overflow-hidden rounded-[var(--ps-radius-input)] border border-[var(--ps-border-soft)]">
            {installments.map(inst => {
              const isPayable = !previewMode && !isCancelled && (inst.status === 'pending' || inst.status === 'overdue');
              return (
                <li key={inst.id} className="flex min-h-[56px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-[12.5px]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--ps-fg)]">
                      {inst.label || `Échéance ${inst.installment_number}`}
                    </p>
                    <p className="ps-num text-[11px] text-[var(--ps-fg-muted)]">
                      {inst.status === 'paid' && inst.paid_at
                        ? `Réglé le ${formatDate(inst.paid_at)}`
                        : `Due le ${formatDate(inst.due_date)}`}
                    </p>
                  </div>
                  <span className="ps-num shrink-0 font-semibold text-[var(--ps-fg)]">{fmtMoney(inst.amount)}</span>
                  <StatutFacture status={inst.status} />
                  {isPayable && (
                    <button
                      type="button"
                      onClick={() => onPay('installment', inst.id)}
                      disabled={payingId === inst.id}
                      className="ps-tap inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-4 text-[12.5px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] disabled:opacity-60"
                    >
                      {payingId === inst.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Payer'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

// ── Ligne de récap chiffré ────────────────────────────────────────────
function RecapRow({ label, amount, tone }: { label: string; amount: string; tone?: 'credit' }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-4 py-3 last:border-b-0">
      <span className="text-[13.5px] text-[var(--ps-fg-secondary)]">{label}</span>
      <span className={`ps-num text-[14px] font-semibold ${tone === 'credit' ? 'text-[var(--ps-success-text)]' : 'text-[var(--ps-fg)]'}`}>
        {amount}
      </span>
    </div>
  );
}
