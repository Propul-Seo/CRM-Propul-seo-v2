// Listes d'options (libellés FR) partagées par les onglets admin.
// Isolées des composants pour ne pas casser le Fast Refresh
// (react-refresh/only-export-components) et éviter la duplication.

export const STEP_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'blocked', label: 'Bloqué' },
];

export const DOC_TYPES: Array<{ value: string; label: string }> = [
  { value: 'quote', label: 'Devis' }, { value: 'contract', label: 'Contrat' },
  { value: 'invoice', label: 'Facture' }, { value: 'deliverable', label: 'Livrable' },
  { value: 'audit', label: 'Audit' }, { value: 'report', label: 'Rapport' },
  { value: 'asset_logo', label: 'Logo' }, { value: 'asset_charter', label: 'Charte' },
  { value: 'asset_content', label: 'Contenu' }, { value: 'asset_access', label: 'Accès' },
  { value: 'legal', label: 'Légal' }, { value: 'other', label: 'Autre' },
];
