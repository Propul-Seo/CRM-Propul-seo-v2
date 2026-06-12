import { useState } from 'react';
import { ArrowRight, Download, ShieldCheck } from 'lucide-react';
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
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ton.dot}`} aria-hidden />
      {INVOICE_STATUS_FR[status]}
    </span>
  );
}

/**
 * Direction A — « Éditorial calme ».
 * Une de revue (kicker unique, phrase d'état, bande de gros chiffres sous
 * filets), tableau éditorial posé sur le fond, détail de la sélection en
 * seule surface élevée, clôture sur le total du projet et le contact.
 */
export function FacturesA({ data }: { data: BenchData }) {
  const { project, referent, invoices } = data;
  const dues = invoices.filter(i => A_REGLER.has(i.status));
  const totalRegle = invoices
    .filter(i => i.status === 'paid')
    .reduce((somme, i) => somme + i.amount_ttc, 0);
  const totalDu = dues.reduce((somme, i) => somme + i.amount_ttc, 0);
  const totalProjet = totalRegle + totalDu;

  const [selId, setSelId] = useState<string>(dues[0]?.id ?? invoices[0]?.id ?? '');
  const sel = invoices.find(i => i.id === selId) ?? null;

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1080px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-12">
      {/* ── Une de revue : kicker unique, phrase d'état, gros chiffres ── */}
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="ps-eyebrow">Facturation</p>
          <p className="text-[12px] text-[var(--ps-fg-muted)]">
            {project.name} · {project.presta}
          </p>
        </div>
        <h1 className="mt-6 max-w-[22ch] text-[clamp(28px,4.2vw,42px)] font-bold leading-[1.12] tracking-[-0.025em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)] [text-wrap:balance] sm:mt-8">
          {totalDu > 0 && dues[0]
            ? dues.length > 1
              ? <>{dues.length} factures totalisant <span className="ps-num">{fmtEUR(totalDu)}</span> attendent votre règlement.</>
              : <>Une facture de <span className="ps-num">{fmtEUR(totalDu)}</span> attend votre règlement.</>
            : <>Vous êtes à jour de vos règlements.</>}
        </h1>
        {totalDu > 0 && dues[0]?.due_date && (
          <p className="ps-body mt-5 max-w-[56ch]">
            Échéance le{' '}
            <span className="ps-num font-medium text-[var(--ps-fg)]">{fmtDateFR(dues[0].due_date)}</span>, règlement
            sécurisé en deux clics depuis cette page.
          </p>
        )}

        <dl className="mt-10 grid grid-cols-2 border-y border-[var(--ps-border)] sm:grid-cols-3 sm:divide-x sm:divide-[var(--ps-border-soft)]">
          <Chiffre libelle="Réglé à ce jour" valeur={fmtEUR(totalRegle)} />
          <Chiffre libelle="Reste à régler" valeur={fmtEUR(totalDu)} division />
          <Chiffre libelle="Prochaine échéance" valeur={fmtCourt(dues[0]?.due_date ?? null)} pleine />
        </dl>
      </header>

      {/* ── Tableau éditorial ── */}
      <section className="mt-12 sm:mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ps-border)] pb-3">
          <h2 className="ps-h3">Toutes les factures</h2>
          <p className="ps-num text-[12px] text-[var(--ps-fg-secondary)]">
            {invoices.length} {invoices.length > 1 ? 'factures' : 'facture'} · depuis {fmtDateFR(invoices[0]?.issued_at ?? null)}
          </p>
        </div>
        <div className="hidden border-b border-[var(--ps-border-soft)] py-2.5 text-[12px] font-medium text-[var(--ps-fg-secondary)] sm:grid sm:grid-cols-[112px_minmax(0,1fr)_130px_130px_110px] sm:gap-6 sm:px-3">
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

      {/* ── Détail de la sélection : LA carte de l'écran ── */}
      {sel && <DetailFacture facture={sel} />}

      {/* ── Clôture : total du projet + contact facturation ── */}
      <footer className="mt-14 grid gap-6 border-t border-[var(--ps-border)] pt-6 sm:mt-20 sm:grid-cols-2 sm:items-end">
        <div>
          <p className="ps-tiny">Total du projet</p>
          <p className="ps-num mt-1 text-[15px] font-medium text-[var(--ps-fg)]">{fmtEUR(totalProjet)} TTC</p>
          <p className="ps-tiny ps-num mt-0.5">
            {fmtEUR(totalRegle)} réglés · {fmtEUR(totalDu)} à venir
          </p>
        </div>
        <div className="sm:text-right">
          <p className="ps-small">Une question sur une facture ?</p>
          <button
            type="button"
            className="group mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
          >
            Écrire à {referent.name.split(' ')[0] ?? referent.name}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Gros chiffre de la bande d'en-tête ─────────────────────────────
function Chiffre({ libelle, valeur, division, pleine }: { libelle: string; valeur: string; division?: boolean; pleine?: boolean }) {
  return (
    <div
      className={`py-7 sm:px-10 sm:first:pl-0 sm:last:pr-0 ${division ? 'max-sm:border-l max-sm:border-[var(--ps-border-soft)] max-sm:pl-6' : ''} ${
        pleine ? 'max-sm:col-span-2 max-sm:border-t max-sm:border-[var(--ps-border-soft)]' : ''
      }`}
    >
      <dt className="text-[12px] font-medium text-[var(--ps-fg-secondary)]">{libelle}</dt>
      <dd className="ps-metric ps-num mt-2.5 text-[var(--ps-fg)]">{valeur}</dd>
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
      className={`flex min-h-[56px] w-full items-center justify-between gap-4 rounded-[var(--ps-radius-input)] px-3 py-3.5 text-left transition-colors duration-150 sm:grid sm:grid-cols-[112px_minmax(0,1fr)_130px_130px_110px] sm:gap-6 ${
        selectionnee ? 'bg-[var(--ps-primary-subtle)]' : 'hover:bg-[var(--ps-bg-subtle)]'
      }`}
    >
      <span className="min-w-0 sm:contents">
        <span className="block truncate text-[13.5px] font-medium text-[var(--ps-fg)] sm:order-2">
          {facture.label}
        </span>
        <span className="ps-num mt-0.5 block text-[11.5px] text-[var(--ps-fg-secondary)] [font-family:var(--ps-font-mono)] sm:order-1 sm:mt-0 sm:self-center sm:text-[12px]">
          {facture.invoice_number}
        </span>
      </span>
      <span className="hidden sm:order-3 sm:block sm:self-center">
        <span className="ps-num text-[13px] text-[var(--ps-fg-secondary)]">{echeance}</span>
      </span>
      <span className="shrink-0 text-right sm:contents">
        <span className="ps-num block text-[14px] font-semibold text-[var(--ps-fg)] [font-family:var(--ps-font-display)] sm:order-5 sm:self-center sm:text-right">
          {fmtEUR(facture.amount_ttc)}
        </span>
        <span className="mt-1 flex justify-end sm:order-4 sm:mt-0 sm:items-center sm:justify-start">
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
    <section className="mt-10 sm:mt-12">
      <div className="ps-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="min-w-0">
            <p className="ps-num text-[12px] text-[var(--ps-fg-muted)] [font-family:var(--ps-font-mono)]">
              {facture.invoice_number}
            </p>
            <h2 className="ps-h2 mt-1.5">{facture.label}</h2>
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
            <p className="ps-num text-[28px] font-semibold leading-none tracking-[-0.02em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
              {fmtEUR(facture.amount_ttc)}
            </p>
            <p className="mt-2 sm:flex sm:justify-end">
              <StatutFacture status={facture.status} />
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-5 border-t border-[var(--ps-border-soft)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          {payable ? (
            <>
              <div className="min-w-0">
                <p className="ps-small flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--ps-fg-muted)]" strokeWidth={2} />
                  Règlement sécurisé par carte ou virement, reçu envoyé automatiquement.
                </p>
                <button
                  type="button"
                  className="group -my-2 mt-1 inline-flex items-center gap-1.5 py-2 text-[13px] font-semibold text-[var(--ps-primary-text)] transition-colors duration-150 hover:text-[var(--ps-primary-hover)]"
                >
                  <Download className="h-3.5 w-3.5" strokeWidth={2} />
                  Télécharger le PDF
                </button>
              </div>
              <button
                type="button"
                className="group ps-tap inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] sm:w-auto"
              >
                Régler {fmtEUR(facture.amount_ttc)}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
              </button>
            </>
          ) : (
            <>
              <p className="ps-small">
                {facture.paid_at
                  ? <>Réglée le <span className="ps-num font-medium text-[var(--ps-fg)]">{fmtDateFR(facture.paid_at)}</span>. Merci pour votre confiance.</>
                  : 'Aucun règlement attendu pour cette facture.'}
              </p>
              <button
                type="button"
                className="ps-tap inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] px-4 text-[13px] font-semibold text-[var(--ps-fg-secondary)] transition-colors duration-200 hover:bg-[var(--ps-bg-subtle)] sm:w-auto"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Télécharger la facture (PDF)
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
