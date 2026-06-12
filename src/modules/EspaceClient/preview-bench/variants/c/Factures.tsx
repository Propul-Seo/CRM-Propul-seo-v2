import { useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, ChevronDown, Download, ShieldCheck } from 'lucide-react';
import type { BenchData, BenchInvoice } from '../../fixtures';
import { INVOICE_STATUS_FR, fmtDateFR, fmtEUR } from '../../fixtures';

/* ─────────────────────────────────────────────────────────────────
 * Variante C — « Récit vertical » · Factures
 * Le récit financier sur la même ligne : ouverture en numéral géant
 * (factures réglées), puis acompte → jalons → solde. Chaque nœud est
 * une facture numérotée (détail en expansion inline animée), et le
 * bilan budgétaire — mini-barres par facture — clôt le récit.
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

/** Paire libellé/valeur des méta composées (à poser dans un <dl>). */
function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-[var(--ps-fg-secondary)]">{label}</dt>
      <dd className="ps-num mt-1 text-[13px] font-semibold text-[var(--ps-fg)]">{children}</dd>
    </div>
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
  const paidCount = billed.filter(i => i.status === 'paid').length;
  const paidTotal = billed.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_ttc, 0);
  const dueTotal = billed.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amount_ttc, 0);
  const billedTotal = billed.reduce((sum, i) => sum + i.amount_ttc, 0);
  const paidPct = billedTotal > 0 ? Math.round((paidTotal / billedTotal) * 100) : 0;
  const maxAmount = billed.length > 0 ? Math.max(...billed.map(i => i.amount_ttc)) : 1;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-4xl px-4 pb-28 pt-10 md:px-12 md:pt-16">
      {/* ── Ouverture du récit financier ───────────────────────── */}
      <header className="md:flex md:items-end md:justify-between md:gap-12">
        <div className="min-w-0">
          <p className="ps-eyebrow">Le fil de vos règlements</p>
          <div className="mt-5 flex items-end gap-4">
            <span className="ps-num text-[64px] font-bold leading-none tracking-[-0.03em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] md:text-[80px]">
              {paidCount}
            </span>
            <div className="min-w-0 pb-1 md:pb-2">
              <p className="text-[12px] font-semibold text-[var(--ps-fg-secondary)]">factures réglées</p>
              <p className="ps-h2 ps-num text-[var(--ps-fg-secondary)]">sur {billed.length} émises</p>
            </div>
          </div>
          <h1 className="ps-h1 mt-5 max-w-lg">
            {dueTotal > 0 ? (
              <>
                Plus que <span className="ps-num">{fmtEUR(dueTotal)}</span> pour solder votre projet
              </>
            ) : (
              'Vous êtes à jour de vos règlements'
            )}
          </h1>
          <p className="ps-small mt-2 max-w-md">
            Le fil ci-dessous retrace chaque facture de « {data.project.name} », de l'acompte au solde.
          </p>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 md:mt-0 md:block md:w-60 md:shrink-0 md:space-y-5 md:border-l md:border-[var(--ps-border-soft)] md:pl-8">
          <Meta label="Total facturé">{fmtEUR(billedTotal)}</Meta>
          <Meta label="Prochaine échéance">{dueInvoice?.due_date ? fmtDateFR(dueInvoice.due_date) : 'Aucune'}</Meta>
        </dl>
      </header>

      {/* ── Le récit financier sur la ligne ────────────────────── */}
      <div className="mt-10 md:mt-12">
        <div
          aria-hidden
          className={`mb-2 ml-[7px] h-8 w-0.5 md:h-10 ${invoices[0]?.status === 'paid' ? 'bg-[var(--ps-success)]' : 'bg-[var(--ps-border-strong)]'}`}
        />

        {invoices.map((inv, idx) => {
          const open = openId === inv.id;
          const isPaid = inv.status === 'paid';
          const isDue = inv.status === 'sent' || inv.status === 'overdue';
          const tone = isPaid ? 'done' : inv.status === 'overdue' ? 'alert' : isDue ? 'strong' : 'idle';

          return (
            <SpineNode key={inv.id} tone={tone} traveled={isPaid}>
              {isDue && (
                <p
                  className={`mb-2 text-[12px] font-semibold ${
                    inv.status === 'overdue' ? 'text-[var(--ps-danger-text)]' : 'text-[var(--ps-primary-text)]'
                  }`}
                >
                  {inv.status === 'overdue' ? 'En retard — à régler' : 'À régler maintenant'}
                </p>
              )}
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : inv.id)}
                className="group flex min-h-[44px] w-full flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[var(--ps-radius-input)] text-left"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span
                    aria-hidden
                    className="ps-num w-9 shrink-0 text-[24px] font-semibold leading-none tracking-[-0.02em] text-[var(--ps-fg-secondary)] [font-family:var(--ps-font-display)]"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--ps-fg)] transition-colors duration-150 group-hover:text-[var(--ps-primary-text)]">
                      {inv.label}
                    </span>
                    <span className="ps-num mt-0.5 block text-[12px] text-[var(--ps-fg-secondary)]">
                      Émise le {fmtDateFR(inv.issued_at)}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3 md:gap-4">
                  <span className="ps-metric ps-num text-[var(--ps-fg)]">{fmtEUR(inv.amount_ttc)}</span>
                  <InvoiceChip status={inv.status} />
                  <ChevronDown
                    aria-hidden
                    className={`h-4 w-4 text-[var(--ps-fg-muted)] transition-transform duration-200 group-hover:text-[var(--ps-fg-secondary)] ${open ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </span>
              </button>

              {/* Détail en expansion inline (grid-rows animées, 200 ms) */}
              <div
                aria-hidden={!open}
                className={`grid transition-[grid-template-rows,visibility] duration-200 [transition-timing-function:var(--ps-ease)] ${
                  open ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]'
                }`}
              >
                <div className="-mx-1 overflow-hidden px-1">
                  <div
                    className={`ps-surface mb-1.5 mt-4 p-5 transition-opacity duration-200 md:p-6 ${open ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                      <Meta label="Référence">{inv.invoice_number}</Meta>
                      <Meta label="Émise le">{fmtDateFR(inv.issued_at)}</Meta>
                      <Meta label="Échéance">{fmtDateFR(inv.due_date)}</Meta>
                      <Meta label={isPaid ? 'Payée le' : 'Montant TTC'}>
                        {isPaid ? fmtDateFR(inv.paid_at) : fmtEUR(inv.amount_ttc)}
                      </Meta>
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
                          className="ps-tap inline-flex min-h-[44px] items-center gap-2 rounded-[var(--ps-radius-input)] border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-5 text-[13px] font-semibold text-[var(--ps-fg-secondary)] transition-colors duration-200 hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
                        >
                          <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                          Télécharger le reçu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SpineNode>
          );
        })}

        {/* ── Clôture du récit : le bilan budgétaire ─────────────── */}
        <SpineNode tone="idle" traveled={false} last>
          <h2 className="ps-h3">Où en est le budget</h2>
          <div className="mt-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-12">
            <div className="flex flex-wrap gap-x-12 gap-y-5 md:flex-col md:gap-y-6">
              <div>
                <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Déjà réglé</p>
                <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(paidTotal)}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Reste à régler</p>
                <p className="ps-metric ps-num mt-2 text-[var(--ps-fg)]">{fmtEUR(dueTotal)}</p>
              </div>
            </div>
            <div className="mt-8 min-w-0 md:mt-0 md:border-l md:border-[var(--ps-border-soft)] md:pl-10">
              <div className="space-y-4">
                {billed.map((inv, i) => (
                  <div key={inv.id} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="min-w-0 truncate text-[12px] font-medium text-[var(--ps-fg-secondary)]">
                        <span className="ps-num">{String(i + 1).padStart(2, '0')}</span> · {inv.label}
                      </p>
                      <p className="ps-num shrink-0 text-[12px] font-semibold text-[var(--ps-fg)]">
                        {fmtEUR(inv.amount_ttc)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)]">
                      <div
                        className={`ps-progress-fill h-full rounded-full ${INV_TONE[inv.status].dot}`}
                        style={{ '--ps-bar-w': `${Math.round((inv.amount_ttc / maxAmount) * 100)}%` } as CSSProperties}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-[var(--ps-border-soft)] pt-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">
                    Réglé sur {fmtEUR(billedTotal)} facturés
                  </p>
                  <p className="ps-num text-[12px] font-semibold text-[var(--ps-fg)]">{paidPct} %</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ps-primary-subtle)]">
                  <div
                    className="ps-progress-fill h-full rounded-full bg-[var(--ps-primary)]"
                    style={{ '--ps-bar-w': `${paidPct}%` } as CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="mt-8 border-t border-[var(--ps-border-soft)] pt-5 text-[13px] text-[var(--ps-fg-secondary)]">
            Un doute sur une facture ? <span className="font-semibold text-[var(--ps-fg)]">{data.referent.name}</span>,
            votre {data.referent.role.toLowerCase()}, vous répond depuis la messagerie — et chaque reçu reste
            téléchargeable sur cette page.
          </p>
        </SpineNode>
      </div>
    </div>
  );
}
