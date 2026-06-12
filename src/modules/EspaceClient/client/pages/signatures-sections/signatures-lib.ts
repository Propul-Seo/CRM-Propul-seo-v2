// Libellés FR et formats de la page Signatures (statuts portail).

export const TYPE_LABELS: Record<string, string> = {
  quote: 'Devis', contract: 'Contrat', addendum: 'Avenant', other: 'Document',
}

export type SignatureStatusKey = 'pending' | 'signed' | 'declined' | 'expired'

/** Narrowing sûr du statut DB (string) vers l'union métier. */
export function toSignatureStatus(s: string): SignatureStatusKey {
  return s === 'signed' || s === 'declined' || s === 'expired' ? s : 'pending'
}

export const STATUT_LIBELLE: Record<SignatureStatusKey, string> = {
  pending: 'En attente',
  signed: 'Signé',
  declined: 'Refusé',
  expired: 'Expiré',
}

export const STATUT_TEXTE: Record<SignatureStatusKey, string> = {
  pending: 'text-[var(--ps-warning-text)]',
  signed: 'text-[var(--ps-success-text)]',
  declined: 'text-[var(--ps-danger-text)]',
  expired: 'text-[var(--ps-fg-secondary)]',
}

export const STATUT_DOT: Record<SignatureStatusKey, string> = {
  pending: 'bg-[var(--ps-warning)]',
  signed: 'bg-[var(--ps-success)]',
  declined: 'bg-[var(--ps-danger)]',
  expired: 'bg-[var(--ps-border-strong)]',
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
