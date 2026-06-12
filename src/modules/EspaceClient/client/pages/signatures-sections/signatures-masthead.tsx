import { PenLine } from 'lucide-react'
import { formatDate, formatShortDate } from './signatures-lib'

// Masthead Signatures — même forme que le masthead Factures : identité à
// gauche (eyebrow + tuile icône + phrase d'état), bande de chiffres à droite.

export interface SignatureStats {
  total: number
  pending: number
  signed: number
  /** Plus proche date limite parmi les documents en attente. */
  nextExpiry: string | null
}

interface SignaturesMastheadProps {
  projectName: string | null
  stats: SignatureStats
}

export function SignaturesMasthead({ projectName, stats }: SignaturesMastheadProps) {
  const { total, pending, signed, nextExpiry } = stats

  const titre = total === 0
    ? 'Aucun document à signer'
    : pending > 0
      ? pending > 1
        ? `${pending} documents en attente de signature`
        : 'Un document en attente de signature'
      : 'Tout est signé — vous êtes à jour'

  const sousLigne = total === 0
    ? `${projectName ?? 'Votre projet'} — vos contrats et devis apparaîtront ici dès qu'ils seront prêts.`
    : pending > 0
      ? [
          nextExpiry ? `à signer avant le ${formatLongDateSignature(nextExpiry)}` : null,
          'signature en ligne sécurisée',
          'deux minutes suffisent',
        ].filter(Boolean).join(' · ')
      : `${signed} document${signed > 1 ? 's' : ''} signé${signed > 1 ? 's' : ''} sur ce projet — chaque exemplaire reste téléchargeable.`

  return (
    <section className="ps-surface p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
        {/* Identité signatures (gauche) */}
        <div className="min-w-0">
          <p className="ps-eyebrow ps-eyebrow-muted">Signatures</p>
          <div className="mt-2 flex items-center gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              pending > 0 ? 'bg-[var(--ps-warning-subtle)]' : 'bg-[var(--ps-primary-subtle)]'
            }`}>
              <PenLine className={`h-5 w-5 ${pending > 0 ? 'text-[var(--ps-warning-text)]' : 'text-[var(--ps-primary)]'}`} strokeWidth={2} />
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
        {total > 0 && (
          <dl className="grid grid-cols-3 gap-4 self-center lg:border-l lg:border-[var(--ps-border-soft)] lg:pl-6">
            <Chiffre libelle="À signer" valeur={String(pending)} fort={pending > 0} />
            <Chiffre libelle="Signés" valeur={String(signed)} />
            <Chiffre libelle="À signer avant" valeur={formatShortDate(nextExpiry)} />
          </dl>
        )}
      </div>
    </section>
  )
}

function Chiffre({ libelle, valeur, fort }: { libelle: string; valeur: string; fort?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-[var(--ps-fg-secondary)]">{libelle}</dt>
      <dd className={`ps-num mt-1 truncate text-[15px] font-semibold tracking-tight [font-family:var(--ps-font-display)] ${
        fort ? 'text-[var(--ps-fg)]' : 'text-[var(--ps-fg-secondary)]'
      }`}>
        {valeur}
      </dd>
    </div>
  )
}
