import { EUR0, formatLongDate, formatShortDate } from './invoice-format';

// Une de revue (direction A « Éditorial calme ») : kicker unique, phrase
// d'état, bande de trois gros chiffres sous filets.

export interface InvoiceStats {
  paidAmount: number;
  totalDue: number;
  dueCount: number;
  overdueAmount: number;
  overdueCount: number;
  nextDue: string | null;
}

interface InvoicesMastheadProps {
  projectName: string | null;
  hasInvoices: boolean;
  stats: InvoiceStats;
}

export function InvoicesMasthead({ projectName, hasInvoices, stats }: InvoicesMastheadProps) {
  const { paidAmount, totalDue, dueCount, overdueAmount, overdueCount, nextDue } = stats;
  return (
    <header>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="ps-eyebrow">Facturation</p>
        <p className="text-[12px] text-[var(--ps-fg-muted)]">
          {projectName ?? 'Votre projet'} — échéances, paiements et historique
        </p>
      </div>

      <h1 className="ps-display-fluid max-w-[24ch] pt-6 text-[var(--ps-fg)] sm:pt-8">
        {!hasInvoices ? (
          <>Aucune facture n'a encore été émise.</>
        ) : totalDue > 0 ? (
          <>
            {dueCount > 1
              ? <>{dueCount} factures totalisant <span className="ps-num">{EUR0.format(totalDue)}</span> attendent votre règlement</>
              : <>Une facture de <span className="ps-num">{EUR0.format(totalDue)}</span> attend votre règlement</>}
            {overdueCount > 0 && <>, dont <span className="ps-num">{EUR0.format(overdueAmount)}</span> en retard</>}
            .
          </>
        ) : (
          <>Tout est réglé — vous êtes à jour de vos paiements.</>
        )}
      </h1>

      {hasInvoices && totalDue > 0 && nextDue && (
        <p className="ps-body mt-5 max-w-[56ch]">
          Prochaine échéance le{' '}
          <span className="ps-num font-medium text-[var(--ps-fg)]">{formatLongDate(nextDue)}</span>, règlement
          sécurisé en deux clics depuis cette page.
        </p>
      )}
      {hasInvoices && totalDue === 0 && paidAmount > 0 && (
        <p className="ps-body mt-5 max-w-[56ch]">
          <span className="ps-num font-medium text-[var(--ps-fg)]">{EUR0.format(paidAmount)}</span> réglés sur ce
          projet — chaque facture reste consultable et téléchargeable ci-dessous.
        </p>
      )}

      {hasInvoices && (
        <dl className="mt-10 grid grid-cols-2 border-y border-[var(--ps-border)] sm:grid-cols-3 sm:divide-x sm:divide-[var(--ps-border-soft)]">
          <Chiffre libelle="Réglé à ce jour" valeur={EUR0.format(paidAmount)} />
          <Chiffre libelle="Reste à régler" valeur={EUR0.format(totalDue)} division />
          <Chiffre libelle="Prochaine échéance" valeur={formatShortDate(nextDue)} pleine />
        </dl>
      )}
    </header>
  );
}

// ── Gros chiffre de la bande d'en-tête ─────────────────────────────
interface ChiffreProps {
  libelle: string;
  valeur: string;
  division?: boolean;
  pleine?: boolean;
}

function Chiffre({ libelle, valeur, division, pleine }: ChiffreProps) {
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
