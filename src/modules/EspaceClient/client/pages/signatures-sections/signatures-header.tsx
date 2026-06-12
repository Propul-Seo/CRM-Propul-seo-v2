import { PenLine } from 'lucide-react'

interface SignaturesHeaderProps {
  total: number
  pending: number
  signed: number
  loading: boolean
}

/**
 * En-tête compact de la page Signatures — même forme que le masthead
 * Factures (eyebrow + tuile icône + titre + compteur), couleurs Aurora.
 */
export function SignaturesHeader({ total, pending, signed, loading }: SignaturesHeaderProps) {
  const titre = total === 0
    ? 'Aucun document à signer'
    : pending > 0
      ? pending > 1
        ? `${pending} documents en attente de signature`
        : 'Un document en attente de signature'
      : 'Tout est signé — vous êtes à jour'

  const compteur = loading
    ? 'Chargement de vos documents…'
    : total === 0
      ? "Vos contrats et devis apparaîtront ici dès qu'ils seront prêts."
      : `${total} document${total > 1 ? 's' : ''} suivi${total > 1 ? 's' : ''} · ${signed} signé${signed > 1 ? 's' : ''} — signature en ligne sécurisée.`

  return (
    <section className="ps-surface p-5">
      <p className="ps-eyebrow ps-eyebrow-muted">Signatures</p>
      <div className="mt-2 flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          pending > 0 ? 'bg-[var(--ps-warning-subtle)]' : 'bg-[var(--ps-primary-subtle)]'
        }`}>
          <PenLine className={`h-5 w-5 ${pending > 0 ? 'text-[var(--ps-warning-text)]' : 'text-[var(--ps-primary)]'}`} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h1 className="ps-h2 truncate text-[var(--ps-fg)]">
            <span className="ps-num">{loading ? 'Vos signatures' : titre}</span>
          </h1>
          <p className="ps-small ps-num truncate">{compteur}</p>
        </div>
      </div>
    </section>
  )
}
