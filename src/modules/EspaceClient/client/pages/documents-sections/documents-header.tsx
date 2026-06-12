import { FileText } from 'lucide-react'

interface DocumentsHeaderProps {
  count: number
  loading: boolean
}

/**
 * En-tête compact de la page Documents — même forme que le masthead Factures
 * (eyebrow + tuile icône + titre + compteur), couleurs Aurora.
 */
export function DocumentsHeader({ count, loading }: DocumentsHeaderProps) {
  const compteur = loading
    ? 'Chargement de vos documents…'
    : count === 0
      ? 'Aucun document partagé pour le moment.'
      : `${count} document${count > 1 ? 's' : ''} partagé${count > 1 ? 's' : ''} — devis, contrats, livrables et assets.`

  return (
    <section className="ps-surface p-5">
      <p className="ps-eyebrow ps-eyebrow-muted">Documents</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-subtle)]">
          <FileText className="h-5 w-5 text-[var(--ps-primary)]" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h1 className="ps-h2 truncate text-[var(--ps-fg)]">Vos documents</h1>
          <p className="ps-small ps-num truncate">{compteur}</p>
        </div>
      </div>
    </section>
  )
}
