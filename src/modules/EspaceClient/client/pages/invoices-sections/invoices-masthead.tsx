import { Receipt } from 'lucide-react';
import { EUR0, formatLongDate, formatShortDate } from './invoice-format';

// En-tête compact (forme « aperçu admin », couleurs Aurora) : identité
// facturation à gauche, bande de chiffres à droite.

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

  const titre = !hasInvoices
    ? "Aucune facture n'a encore été émise"
    : totalDue > 0
      ? dueCount > 1
        ? `${dueCount} factures à régler · ${EUR0.format(totalDue)}`
        : `Une facture de ${EUR0.format(totalDue)} à régler`
      : 'Tout est réglé — vous êtes à jour';

  const sousLigne = !hasInvoices
    ? `${projectName ?? 'Votre projet'} — les factures apparaîtront ici dès leur émission.`
    : totalDue > 0
      ? [
          overdueCount > 0 ? `${EUR0.format(overdueAmount)} en retard` : null,
          nextDue ? `prochaine échéance le ${formatLongDate(nextDue)}` : null,
          'règlement sécurisé en deux clics',
        ].filter(Boolean).join(' · ')
      : `${EUR0.format(paidAmount)} réglés sur ce projet — chaque facture reste téléchargeable.`;

  return (
    <section className="ps-surface p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
        {/* Identité facturation (gauche) */}
        <div className="min-w-0">
          <p className="ps-eyebrow ps-eyebrow-muted">Facturation</p>
          <div className="mt-2 flex items-center gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              overdueCount > 0 ? 'bg-[var(--ps-danger-subtle)]' : 'bg-[var(--ps-primary-subtle)]'
            }`}>
              <Receipt className={`h-5 w-5 ${overdueCount > 0 ? 'text-[var(--ps-danger)]' : 'text-[var(--ps-primary)]'}`} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1 className="ps-h2 truncate text-[var(--ps-fg)]">
                <span className="ps-num">{titre}</span>
              </h1>
              <p className="ps-small truncate">{projectName ?? 'Votre projet'}</p>
            </div>
          </div>
          <p className="ps-small ps-num mt-3 text-[var(--ps-fg-secondary)]">{sousLigne}</p>
        </div>

        {/* Chiffres (droite) */}
        {hasInvoices && (
          <dl className="grid grid-cols-3 gap-4 self-center lg:border-l lg:border-[var(--ps-border-soft)] lg:pl-6">
            <Chiffre libelle="Réglé à ce jour" valeur={EUR0.format(paidAmount)} />
            <Chiffre libelle="Reste à régler" valeur={EUR0.format(totalDue)} fort={totalDue > 0} />
            <Chiffre libelle="Prochaine échéance" valeur={formatShortDate(nextDue)} />
          </dl>
        )}
      </div>
    </section>
  );
}

function Chiffre({ libelle, valeur, fort }: { libelle: string; valeur: string; fort?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-[var(--ps-fg-secondary)]">{libelle}</dt>
      <dd className={`ps-num mt-1 truncate text-[16px] font-semibold tracking-tight [font-family:var(--ps-font-display)] ${
        fort ? 'text-[var(--ps-fg)]' : 'text-[var(--ps-fg-secondary)]'
      }`}>
        {valeur}
      </dd>
    </div>
  );
}
