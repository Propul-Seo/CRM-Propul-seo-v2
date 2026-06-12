// Vocabulaire des statuts côté CLIENT (décision actée) : « sent » s'affiche
// « À régler » (ton warning) et non « Envoyée » comme dans l'admin. Le
// StatusBadge partagé (shared/components/Badge.tsx) est utilisé par le
// back-office : ce mapping de libellés reste donc LOCAL à la page Factures.
// Anatomie DA : dot + libellé français, jamais la couleur seule.

interface TonStatut {
  dot: string;
  texte: string;
  label: string;
}

const NEUTRE = {
  dot: 'bg-[var(--ps-border-strong)]',
  texte: 'text-[var(--ps-fg-secondary)]',
};

const TON_STATUT: Record<string, TonStatut> = {
  // factures
  paid:           { dot: 'bg-[var(--ps-success)]', texte: 'text-[var(--ps-success-text)]', label: 'Payée' },
  sent:           { dot: 'bg-[var(--ps-warning)]', texte: 'text-[var(--ps-warning-text)]', label: 'À régler' },
  overdue:        { dot: 'bg-[var(--ps-danger)]',  texte: 'text-[var(--ps-danger-text)]',  label: 'En retard' },
  partially_paid: { dot: 'bg-[var(--ps-warning)]', texte: 'text-[var(--ps-warning-text)]', label: 'Partiellement payée' },
  draft:          { ...NEUTRE, label: 'Brouillon' },
  cancelled:      { ...NEUTRE, label: 'Annulée' },
  refunded:       { dot: 'bg-[var(--ps-info)]', texte: 'text-[var(--ps-info-text)]', label: 'Remboursée' },
  // échéances (installments)
  pending:        { dot: 'bg-[var(--ps-warning)]', texte: 'text-[var(--ps-warning-text)]', label: 'En attente' },
};

export function StatutFacture({ status }: { status: string }) {
  const ton = TON_STATUT[status] ?? { ...NEUTRE, label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${ton.texte}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ton.dot}`} aria-hidden />
      {ton.label}
    </span>
  );
}
