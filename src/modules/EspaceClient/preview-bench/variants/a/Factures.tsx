import { useState } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import type { InvoiceStatus } from '@/modules/EspaceClient/shared/types/portal.types';
import type { BenchData, BenchInvoice } from '../../fixtures';
import { fmtEUR, fmtDateFR, INVOICE_STATUS_FR } from '../../fixtures';

const fmtCourt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

const A_REGLER = new Set<InvoiceStatus>(['sent', 'overdue']);

const TON_STATUT: Record<InvoiceStatus, { dot: string; texte: string }> = {
  paid:      { dot: 'bg-[var(--ps-success)]',       texte: 'text-[var(--ps-success-text)]' },
  sent:      { dot: 'bg-[var(--ps-warning)]',       texte: 'text-[var(--ps-warning-text)]' },
  overdue:   { dot: 'bg-[var(--ps-danger)]',        texte: 'text-[var(--ps-danger-text)]' },
  draft:     { dot: 'bg-[var(--ps-border-strong)]', texte: 'text-[var(--ps-fg-secondary)]' },
  cancelled: { dot: 'bg-[var(--ps-border-strong)]', texte: 'text-[var(--ps-fg-secondary)]' },
  refunded:  { dot: 'bg-[var(--ps-info)]',          texte: 'text-[var(--ps-info-text)]' },
};

function StatutFacture({ status }: { status: InvoiceStatus }) {
  const ton = TON_STATUT[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${ton.texte}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ton.dot}`} />
      {INVOICE_STATUS_FR[status]}
    </span>
  );
}

/**
 * Direction A — « Éditorial calme ».
 * Tableau éditorial sur le fond, gros chiffres typographiques en tête,
 * détail de la facture sélectionnée en zone basse (seule surface élevée).
 */
export function FacturesA({ data }: { data: BenchData }) {
  const { project, invoices } = data;
  const dues = invoices.filter(i => A_REGLER.has(i.status));
  const totalRegle = invoices
    .filter(i => i.status === 'paid')
    .reduce((somme, i) => somme + i.amount_ttc, 0);
  const totalDu = dues.reduce((somme, i) => somme + i.amount_ttc, 0);

  const [selId, setSelId] = useState<string>(dues[0]?.id ?? invoices[0]?.id ?? '');
  const sel = invoices.find(i => i.id === selId) ?? null;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1040px] px-5 pb-20 pt-10 sm:px-8 lg:px-12">
      {/* En-tête de contenu */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ps-border-soft)] pb-4">
        <p className="text-[13px] font-medium text-[var(--ps-fg)]">{project.name}</p>
        <p className="text-[12px] text-[var(--ps-fg-secondary)]">Facturation</p>
      </header>

      {/* Phrase d'état */}
      <section className="mt-14 sm:mt-20">
        <h1 className="ps-h1 max-w-[30ch] [text-wrap:balance]">
          {totalDu > 0 && dues[0]
            ? dues.length > 1
              ? <>{dues.length} factures totalisant <span className="ps-num">{fmtEUR(totalDu)}</span> attendent votre règlement.</>
              : <>Une facture de <span className="ps-num">{fmtEUR(totalDu)}</span> attend votre règlement.</>
            : <>Vous êtes à jour de vos règlements.</>}
        </h1>
        {totalDu > 0 && dues[0]?.due_date && (
          <p className="ps-small mt-4">Échéance le {fmtDateFR(dues[0].due_date)} — règlement en deux clics ci-dessous.</p>
        )}
      </section>

      {/* Gros chiffres typographiques, séparés par un filet */}
      <dl className="mt-12 grid grid-cols-2 divide-x divide-[var(--ps-border-soft)] border-y border-[var(--ps-border-soft)]">
        <div className="flex flex-col-reverse gap-2.5 py-8 pr-6 sm:pr-12">
          <dt className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Réglé à ce jour</dt>
          <dd className="ps-num text-[clamp(26px,3.4vw,34px)] font-semibold tracking-[-0.02em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
            {fmtEUR(totalRegle)}
          </dd>
        </div>
        <div className="flex flex-col-reverse gap-2.5 py-8 pl-6 sm:pl-12">
          <dt className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">Reste à régler</dt>
          <dd className="ps-num text-[clamp(26px,3.4vw,34px)] font-semibold tracking-[-0.02em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
            {fmtEUR(totalDu)}
          </dd>
        </div>
      </dl>

      {/* Tableau éditorial */}
      <section className="mt-12 sm:mt-16">
        <div className="hidden border-b border-[var(--ps-border-soft)] pb-2.5 text-[12px] font-medium text-[var(--ps-fg-secondary)] sm:grid sm:grid-cols-[112px_minmax(0,1fr)_130px_130px_110px] sm:gap-6 sm:px-3">
          <span>Numéro</span>
          <span>Libellé</span>
          <span>Échéance</span>
          <span>Statut</span>
          <span className="text-right">Montant TTC</span>
        </div>
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {invoices.map(facture => (
            <li key={facture.id}>
              <LigneFacture
                facture={facture}
                selectionnee={facture.id === selId}
                onSelect={() => setSelId(facture.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Détail de la sélection — la seule surface élevée */}
      {sel && <DetailFacture facture={sel} />}
    </div>
  );
}

// ── Ligne du tableau (bouton de sélection) ─────────────────────────
interface LigneProps { facture: BenchInvoice; selectionnee: boolean; onSelect: () => void }

function LigneFacture({ facture, selectionnee, onSelect }: LigneProps) {
  const echeance = facture.status === 'paid'
    ? `Payée le ${fmtCourt(facture.paid_at)}`
    : fmtCourt(facture.due_date);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selectionnee}
      className={`flex min-h-[56px] w-full items-center justify-between gap-4 rounded-[10px] px-3 py-3.5 text-left transition-colors duration-150 sm:grid sm:grid-cols-[112px_minmax(0,1fr)_130px_130px_110px] sm:gap-6 ${
        selectionnee ? 'bg-[var(--ps-primary-subtle)]' : 'hover:bg-[var(--ps-bg-subtle)]'
      }`}
    >
      <span className="min-w-0 sm:contents">
        <span className="block truncate text-[13.5px] font-medium text-[var(--ps-fg)] sm:order-2">
          {facture.label}
        </span>
        <span className="mt-0.5 block text-[11.5px] text-[var(--ps-fg-secondary)] [font-family:var(--ps-font-mono)] sm:order-1 sm:mt-0 sm:text-[12px]">
          {facture.invoice_number}
        </span>
      </span>
      <span className="hidden sm:order-3 sm:block">
        <span className="ps-num text-[13px] text-[var(--ps-fg-secondary)]">{echeance}</span>
      </span>
      <span className="shrink-0 text-right sm:contents">
        <span className="ps-num block text-[14px] font-semibold text-[var(--ps-fg)] [font-family:var(--ps-font-display)] sm:order-5 sm:text-right">
          {fmtEUR(facture.amount_ttc)}
        </span>
        <span className="mt-1 flex justify-end sm:order-4 sm:mt-0 sm:justify-start">
          <StatutFacture status={facture.status} />
        </span>
      </span>
    </button>
  );
}

// ── Zone basse : détail + règlement ────────────────────────────────
function DetailFacture({ facture }: { facture: BenchInvoice }) {
  const payable = A_REGLER.has(facture.status);
  return (
    <section className="mt-12 sm:mt-16">
      <div className="ps-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] text-[var(--ps-fg-secondary)] [font-family:var(--ps-font-mono)]">
              {facture.invoice_number}
            </p>
            <h2 className="ps-h2 mt-1">{facture.label}</h2>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-[var(--ps-fg-secondary)]">
              <div className="flex gap-1.5">
                <dt>Émise le</dt>
                <dd className="ps-num font-medium text-[var(--ps-fg)]">{fmtDateFR(facture.issued_at)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Échéance</dt>
                <dd className="ps-num font-medium text-[var(--ps-fg)]">{fmtDateFR(facture.due_date)}</dd>
              </div>
              {facture.paid_at && (
                <div className="flex gap-1.5">
                  <dt>Payée le</dt>
                  <dd className="ps-num font-medium text-[var(--ps-fg)]">{fmtDateFR(facture.paid_at)}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="ps-num text-[28px] font-semibold tracking-[-0.02em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
              {fmtEUR(facture.amount_ttc)}
            </p>
            <p className="mt-1.5 sm:flex sm:justify-end">
              <StatutFacture status={facture.status} />
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-[var(--ps-border-soft)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          {payable ? (
            <>
              <p className="ps-small max-w-[48ch]">Règlement sécurisé par carte ou virement, reçu envoyé automatiquement.</p>
              <button
                type="button"
                className="ps-tap inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)]"
              >
                Régler {fmtEUR(facture.amount_ttc)}
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="ps-tap inline-flex min-h-[44px] items-center gap-2 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-200 hover:text-[var(--ps-primary-hover)]"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              Télécharger la facture (PDF)
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
