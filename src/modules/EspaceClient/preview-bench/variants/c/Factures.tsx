import { useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, ChevronDown, Download, ShieldCheck } from 'lucide-react';
import type { BenchData, BenchInvoice } from '../../fixtures';
import { INVOICE_STATUS_FR, fmtDateFR, fmtEUR } from '../../fixtures';

/* ─────────────────────────────────────────────────────────────────
 * Variante C — « Récit vertical » · Factures
 * Le récit financier sur la même ligne : acompte → jalons → solde.
 * Chaque nœud est une facture (montant fort, statut, date) ; le
 * détail s'ouvre en expansion inline, le total clôt le récit.
 * ──────────────────────────────────────────────────────────────── */

const INV_TONE: Record<BenchInvoice['status'], { dot: string; chip: string }> = {
  paid: { dot: 'bg-[var(--ps-success)]', chip: 'bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]' },
  sent: { dot: 'bg-[var(--ps-warning)]', chip: 'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]' },
  overdue: { dot: 'bg-[var(--ps-danger)]', chip: 'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]' },
  refunded: { dot: 'bg-[var(--ps-info)]', chip: 'bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]' },
  draft: { dot: 'bg-[var(--ps-fg-muted)]', chip: 'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]' },
  cancelled: { dot: 'bg-[var(--ps-fg-muted)]', chip: 'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]' },
};

function InvoiceChip({ status }: { status: BenchInvoice['status'] }) {
  const t = INV_TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${t.chip}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {INVOICE_STATUS_FR[status]}
    </span>
  );
}

/** Nœud du récit financier sur la colonne vertébrale. */
function SpineNode({ tone, traveled, last = false, children }: {
  tone: 'done' | 'strong' | 'alert' | 'idle';
  traveled: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const dot =
    tone === 'done'
      ? 'border-2 border-[var(--ps-bg)] bg-[var(--ps-success)]'
      : tone === 'strong'
        ? 'border-[3px] border-[var(--ps-primary-subtle)] bg-[var(--ps-primary)]'
        : tone === 'alert'
          ? 'border-[3px] border-[var(--ps-danger-subtle)] bg-[var(--ps-danger)]'
          : 'border-2 border-[var(--ps-border-strong)] bg-[var(--ps-bg-elevated)]';
  return (
    <section className="relative pb-10 pl-10 last:pb-0 md:pb-12 md:pl-14">
      {!last && (
        <span
          aria-hidden
          className={`absolute bottom-0 left-[7px] top-6 w-0.5 ${traveled ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
        />
      )}
      <span aria-hidden className={`absolute left-0 top-1.5 h-4 w-4 rounded-full ${dot}`} />
      {children}
    </section>
  );
}

export function FacturesC({ data }: { data: BenchData }) {
  const invoices = [...data.invoices].sort((a, b) => a.issued_at.localeCompare(b.issued_at));
  const dueInvoice = invoices.find(i => i.status === 'sent' || i.status === 'overdue');
  const [openId, setOpenId] = useState<string | null>(dueInvoice?.id ?? null);

  const billed = invoices.filter(i => i.status !== 'cancelled' && i.status !== 'refunded' && i.status !== 'draft');
  const paidTotal = billed.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_ttc, 0);
  const dueTotal = billed.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amount_ttc, 0);
  const billedTotal = billed.reduce((sum, i) => sum + i.amount_ttc, 0);
  const paidPct = billedTotal > 0 ? Math.round((paidTotal / billedTotal) * 100) : 0;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-3xl px-4 pb-28 pt-10 md:px-12 md:pt-16">
      {/* ── En-tête de contenu ─────────────────────────────────── */}
      <header>
        <p className="ps-eyebrow">Le fil de vos règlements</p>
        <h1 className="ps-h1 mt-2">
          {dueTotal > 0 ? (
            <>
              Plus que <span className="ps-num">{fmtEUR(dueTotal)}</span> pour solder votre projet
            </>
          ) : (
            'Vous êtes à jour de vos règlements'
          )}
        </h1>
        <p className="ps-small mt-2">
          {billed.length} facture{billed.length > 1 ? 's' : ''} émise{billed.length > 1 ? 's' : ''} pour « {data.project.name} »
          {dueInvoice?.due_date && <> · prochaine échéance le {fmtDateFR(dueInvoice.due_date)}</>}.
        </p>
      </header>

      {/* ── Le récit financier sur la ligne ────────────────────── */}
      <div className="mt-10 md:mt-12">
        <div aria-hidden className="mb-2 ml-[7px] h-8 w-0.5 bg-[var(--ps-border-strong)] md:h-10" />

        {invoices.map(inv => {
          const open = openId === inv.id;
          const isPaid = inv.status === 'paid';
          const isDue = inv.status === 'sent' || inv.status === 'overdue';
          const tone = isPaid ? 'done' : inv.status === 'overdue' ? 'alert' : isDue ? 'strong' : 'idle';

          return (
            <SpineNode key={inv.id} tone={tone} traveled={isPaid}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : inv.id)}
                className="group flex min-h-[44px] w-full flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[var(--ps-radius-input)] text-left"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-[var(--ps-fg)]">{inv.label}</span>
                  <span className="ps-num mt-0.5 block text-[12px] text-[var(--ps-fg-secondary)]">
                    Émise le {fmtDateFR(inv.issued_at)}
                  </span>
                </span>
                <span className="flex items-center gap-3 md:gap-4">
                  <span className="ps-metric ps-num text-[var(--ps-fg)]">{fmtEUR(inv.amount_ttc)}</span>
                  <InvoiceChip status={inv.status} />
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-[var(--ps-fg-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </span>
              </button>

              {open && (
                <div className="ps-surface ps-fade-in mt-4 p-5 md:p-6">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    <div>
                      <dt className="text-[12px] text-[var(--ps-fg-secondary)]">Référence</dt>
                      <dd className="ps-num mt-1 text-[13px] font-semibold text-[var(--ps-fg)]">{inv.invoice_number}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[var(--ps-fg-secondary)]">Émise le</dt>
                      <dd className="ps-num mt-1 text-[13px] font-semibold text-[var(--ps-fg)]">{fmtDateFR(inv.issued_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[var(--ps-fg-secondary)]">Échéance</dt>
                      <dd className="ps-num mt-1 text-[13px] font-semibold text-[var(--ps-fg)]">{fmtDateFR(inv.due_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[var(--ps-fg-secondary)]">{isPaid ? 'Payée le' : 'Montant TTC'}</dt>
                      <dd className="ps-num mt-1 text-[13px] font-semibold text-[var(--ps-fg)]">
                        {isPaid ? fmtDateFR(inv.paid_at) : fmtEUR(inv.amount_ttc)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--ps-border-soft)] pt-5">
                    {isDue ? (
                      <>
                        <button
                          type="button"
                          className="ps-tap inline-flex min-h-[44px] items-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
                        >
                          Régler {fmtEUR(inv.amount_ttc)}
                          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ps-fg-secondary)]">
                          <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
                          Paiement sécurisé par Stripe
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="ps-tap inline-flex min-h-[44px] items-center gap-2 rounded-[var(--ps-radius-input)] border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-5 text-[13px] font-semibold text-[var(--ps-fg-secondary)] transition-colors duration-200 hover:bg-[var(--ps-bg-subtle)]"
                      >
                        <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                        Télécharger le reçu
                      </button>
                    )}
                  </div>
                </div>
              )}
            </SpineNode>
          );
        })}

        {/* ── Clôture du récit : le total ────────────────────────── */}
        <SpineNode tone="idle" traveled={false} last>
          <h2 className="ps-h3">Où en est le budget</h2>
          <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-5">
            <div>
              <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Déjà réglé</p>
              <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(paidTotal)}</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Reste à régler</p>
              <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(dueTotal)}</p>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">
                  Sur {fmtEUR(billedTotal)} facturés
                </span>
                <span className="ps-num text-[12px] font-semibold text-[var(--ps-fg)]">{paidPct} %</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
                <div
                  className="ps-progress-fill h-full rounded-full bg-[var(--ps-primary)]"
                  style={{ '--ps-bar-w': `${paidPct}%` } as CSSProperties}
                />
              </div>
            </div>
          </div>
        </SpineNode>
      </div>
    </div>
  );
}
