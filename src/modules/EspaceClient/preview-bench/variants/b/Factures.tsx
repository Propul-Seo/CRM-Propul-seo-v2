import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Lock } from 'lucide-react';
import type { InvoiceStatus } from '@/modules/EspaceClient/shared/types/portal.types';
import { Badge, type BadgeTone } from '@/modules/EspaceClient/shared/components';
import { fmtDateFR, fmtEUR, INVOICE_STATUS_FR, type BenchData, type BenchInvoice } from '../../fixtures';

const DUE_STATUSES = new Set<InvoiceStatus>(['sent', 'overdue']);

const STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  draft: 'gray', sent: 'amber', paid: 'green', overdue: 'red', cancelled: 'gray', refunded: 'blue',
};

const DOT_CLASS: Record<InvoiceStatus, string> = {
  draft: 'bg-[var(--ps-fg-muted)]',
  sent: 'bg-[var(--ps-warning)]',
  paid: 'bg-[var(--ps-success)]',
  overdue: 'bg-[var(--ps-danger)]',
  cancelled: 'bg-[var(--ps-fg-muted)]',
  refunded: 'bg-[var(--ps-info)]',
};

// Direction B — « Matière & panneaux » : master/detail visible, rail gauche
// compact + panneau de détail avec ligne de vie du paiement.
export function FacturesB({ data }: { data: BenchData }) {
  const { invoices, project } = data;
  const [selectedId, setSelectedId] = useState<string>(
    () => invoices.find(i => DUE_STATUSES.has(i.status))?.id ?? invoices[0]?.id ?? '',
  );
  const selected = invoices.find(i => i.id === selectedId) ?? invoices[0];

  const dueTotal = invoices.filter(i => DUE_STATUSES.has(i.status)).reduce((s, i) => s + i.amount_ttc, 0);
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_ttc, 0);

  return (
    <div className="ps-fade-in mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      {/* ── En-tête de contenu ── */}
      <header>
        <h1 className="ps-h1">
          {dueTotal > 0 ? (
            <>Il vous reste <span className="ps-num text-[var(--ps-primary)]">{fmtEUR(dueTotal)}</span> à régler — <span className="ps-num">{fmtEUR(paidTotal)}</span> déjà réglés.</>
          ) : (
            <>Toutes vos factures sont réglées — merci pour votre confiance.</>
          )}
        </h1>
        <p className="ps-small mt-2">
          <span className="ps-num">{invoices.length}</span> factures · {project.name}
        </p>
      </header>

      {/* ── Master / detail ── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Rail gauche : liste compacte */}
        <section className="ps-surface self-start overflow-hidden lg:sticky lg:top-8">
          <h2 className="ps-h3 border-b border-[var(--ps-border-soft)] px-5 py-3.5">Vos factures</h2>
          <ul className="divide-y divide-[var(--ps-border-soft)]">
            {invoices.map(inv => (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(inv.id)}
                  aria-current={inv.id === selected?.id}
                  className={`ps-tap flex min-h-[64px] w-full flex-col gap-1 px-5 py-3.5 text-left transition-colors ${
                    inv.id === selected?.id
                      ? 'bg-[var(--ps-primary-subtle)]'
                      : 'hover:bg-[var(--ps-bg-subtle)]'
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="ps-num text-[12px] font-medium text-[var(--ps-fg-secondary)]">{inv.invoice_number}</span>
                    <span className="ps-num text-[13.5px] font-semibold text-[var(--ps-fg)]">{fmtEUR(inv.amount_ttc)}</span>
                  </span>
                  <span className="block truncate text-[13px] font-medium text-[var(--ps-fg)]">{inv.label}</span>
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--ps-fg-secondary)]">
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[inv.status]}`} />
                    {INVOICE_STATUS_FR[inv.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Panneau de détail */}
        {selected && <InvoiceDetail invoice={selected} />}
      </div>
    </div>
  );
}

// ── Détail d'une facture : montant fort + ligne de vie du paiement ──
function InvoiceDetail({ invoice }: { invoice: BenchInvoice }) {
  const isDue = DUE_STATUSES.has(invoice.status);
  const stages = [
    { key: 'issued', label: 'Émise', date: invoice.issued_at, done: true },
    { key: 'sent', label: 'Envoyée', date: invoice.status === 'draft' ? null : invoice.issued_at, done: invoice.status !== 'draft' },
    { key: 'paid', label: 'Payée', date: invoice.paid_at, done: invoice.status === 'paid' },
  ];

  return (
    <section className="ps-surface overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5 md:px-8">
        <div className="min-w-0">
          <h2 className="ps-h2">{invoice.label}</h2>
          <p className="ps-small ps-num mt-1 text-[var(--ps-fg-secondary)]">Facture {invoice.invoice_number}</p>
        </div>
        <Badge tone={STATUS_TONE[invoice.status]}>{INVOICE_STATUS_FR[invoice.status]}</Badge>
      </div>

      {/* Bloc montant fort */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-y border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-6 py-5 md:px-8">
        <div>
          <p className="ps-small text-[var(--ps-fg-secondary)]">Montant TTC</p>
          <p className="ps-metric ps-num pt-1.5 text-[var(--ps-fg)]">{fmtEUR(invoice.amount_ttc)}</p>
        </div>
        <div className="text-right">
          <p className="ps-small text-[var(--ps-fg-secondary)]">{invoice.status === 'paid' ? 'Réglée le' : 'Échéance'}</p>
          <p className="ps-num pt-1 text-[15px] font-semibold text-[var(--ps-fg)]">
            {invoice.status === 'paid' ? fmtDateFR(invoice.paid_at) : fmtDateFR(invoice.due_date)}
          </p>
        </div>
      </div>

      {/* Ligne de vie du paiement */}
      <div className="px-6 py-6 md:px-8">
        <h3 className="ps-h3">Ligne de vie du paiement</h3>
        <ol className="mt-5 flex">
          {stages.map((stage, idx) => (
            <li key={stage.key} className="relative flex flex-1 flex-col items-center gap-2">
              {idx > 0 && (
                <span
                  aria-hidden
                  className={`absolute left-[-50%] right-[50%] top-3 mx-4 h-px ${
                    stage.done ? 'bg-[var(--ps-primary)]' : 'bg-[var(--ps-border)]'
                  }`}
                />
              )}
              <LifelineDot done={stage.done} active={!stage.done && (stages[idx - 1]?.done ?? false)} />
              <span className="text-center">
                <span className={`block text-[12.5px] font-semibold ${stage.done ? 'text-[var(--ps-fg)]' : 'text-[var(--ps-fg-secondary)]'}`}>
                  {stage.label}
                </span>
                <span className="ps-small ps-num block text-[var(--ps-fg-secondary)]">
                  {stage.date ? fmtDateFR(stage.date) : stage.done ? '—' : 'En attente'}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Pied : règlement ou confirmation */}
      {isDue ? (
        <div className="flex flex-col gap-3 border-t border-[var(--ps-border-soft)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p className="ps-small flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)]" strokeWidth={2} />
            Paiement sécurisé par Stripe — reçu envoyé immédiatement.
          </p>
          <button
            type="button"
            className="ps-tap inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--ps-primary)] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--ps-primary-hover)]"
          >
            Régler {fmtEUR(invoice.amount_ttc)}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : invoice.status === 'paid' ? (
        <div className="border-t border-[var(--ps-border-soft)] px-6 py-5 md:px-8">
          <p className="flex items-center gap-2 rounded-[8px] bg-[var(--ps-success-subtle)] px-4 py-3 text-[13px] font-medium text-[var(--ps-success-text)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            Facture réglée le {fmtDateFR(invoice.paid_at)} — merci pour votre ponctualité.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function LifelineDot({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return (
      <span className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ps-primary)] text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (active) {
    return (
      <span className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ps-primary-subtle)]">
        <span className="ps-pulse h-2.5 w-2.5 rounded-full bg-[var(--ps-primary)]" />
      </span>
    );
  }
  return (
    <span className="z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--ps-border)] bg-[var(--ps-bg-subtle)]">
      <span className="h-2 w-2 rounded-full bg-[var(--ps-border-strong)]" />
    </span>
  );
}
