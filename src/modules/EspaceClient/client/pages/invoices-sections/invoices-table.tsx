import { Search } from 'lucide-react';
import type { PortalInvoice } from '@/modules/EspaceClient/client/hooks/usePortalData';
import { formatLongDate, formatShortDate, money } from './invoice-format';
import { StatutFacture } from './invoice-status';

// Tableau éditorial posé sur le fond : numéro mono, montants Space Grotesk à
// droite, statut dot + libellé, lignes sélectionnables ≥ 56 px.

const GRID = 'sm:grid sm:grid-cols-[112px_minmax(0,1fr)_120px_150px_120px] sm:gap-6';

interface InvoicesTableProps {
  rows: PortalInvoice[];
  totalCount: number;
  oldestIssue: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
}

export function InvoicesTable({
  rows, totalCount, oldestIssue, selectedId, onSelect, query, onQueryChange,
}: InvoicesTableProps) {
  return (
    <section className="mt-4" aria-label="Toutes les factures">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--ps-border)] pb-3">
        <div>
          <h2 className="ps-h3">Toutes les factures</h2>
          <p className="ps-num mt-0.5 text-[12px] text-[var(--ps-fg-secondary)]">
            {totalCount} {totalCount > 1 ? 'factures' : 'facture'} · depuis {formatLongDate(oldestIssue)}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
          <input
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Chercher une facture…"
            aria-label="Chercher une facture par numéro ou libellé"
            className="h-10 w-full rounded-[var(--ps-radius-input)] border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] pl-9 pr-3 text-[13.5px] text-[var(--ps-fg)] transition-colors duration-200 hover:border-[var(--ps-border-strong)]"
          />
        </div>
      </div>

      <div className={`hidden border-b border-[var(--ps-border-soft)] py-2.5 text-[12px] font-medium text-[var(--ps-fg-secondary)] sm:px-3 ${GRID}`}>
        <span>Numéro</span>
        <span>Libellé</span>
        <span>Échéance</span>
        <span>Statut</span>
        <span className="text-right">Montant TTC</span>
      </div>

      <ul className="divide-y divide-[var(--ps-border-soft)]">
        {rows.length === 0 && (
          <li className="px-3 py-5 text-center text-[12.5px] text-[var(--ps-fg-muted)]">
            Aucune facture ne correspond.
          </li>
        )}
        {rows.map(inv => (
          <li key={inv.id}>
            <LigneFacture invoice={inv} selectionnee={inv.id === selectedId} onSelect={() => onSelect(inv.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Ligne du tableau (bouton de sélection) ─────────────────────────
interface LigneProps {
  invoice: PortalInvoice;
  selectionnee: boolean;
  onSelect: () => void;
}

function LigneFacture({ invoice, selectionnee, onSelect }: LigneProps) {
  const echeance =
    invoice.status === 'paid' && invoice.paid_at
      ? `Payée le ${formatShortDate(invoice.paid_at)}`
      : invoice.status === 'cancelled'
        ? '—'
        : formatShortDate(invoice.due_date);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selectionnee}
      className={`flex min-h-[48px] w-full items-center justify-between gap-4 rounded-[var(--ps-radius-input)] px-3 py-3 text-left transition-[background-color,box-shadow] duration-150 [transition-timing-function:var(--ps-ease)] ${GRID} ${
        selectionnee
          ? 'bg-[var(--ps-primary-subtle)] shadow-[inset_3px_0_0_0_var(--ps-primary)]'
          : 'hover:bg-[var(--ps-bg-subtle)]'
      }`}
    >
      <span className="min-w-0 sm:contents">
        <span className="block truncate text-[13.5px] font-medium text-[var(--ps-fg)] sm:order-2">
          {invoice.title ?? 'Facture'}
        </span>
        <span className="ps-num mt-0.5 block text-[11.5px] text-[var(--ps-fg-secondary)] [font-family:var(--ps-font-mono)] sm:order-1 sm:mt-0 sm:self-center sm:text-[12px]">
          {invoice.invoice_number ?? 'Brouillon'}
        </span>
      </span>
      <span className="hidden sm:order-3 sm:block sm:self-center">
        <span className="ps-num text-[13px] text-[var(--ps-fg-secondary)]">{echeance}</span>
      </span>
      <span className="shrink-0 text-right sm:contents">
        <span className="ps-num block text-[14px] font-semibold text-[var(--ps-fg)] [font-family:var(--ps-font-display)] sm:order-5 sm:self-center sm:text-right">
          {invoice.status === 'draft' ? '—' : money(invoice.amount_total, invoice.currency)}
        </span>
        <span className="mt-1 flex justify-end sm:order-4 sm:mt-0 sm:items-center sm:justify-start">
          <StatutFacture status={invoice.status} />
        </span>
      </span>
    </button>
  );
}
