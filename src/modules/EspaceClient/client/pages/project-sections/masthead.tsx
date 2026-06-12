import type { CSSProperties, ReactNode } from 'react'
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { formatLong, toStepStatus } from './format'

interface MastheadProps {
  projectName: string
  prestaLabel: string
  hasSteps: boolean
  current: PortalProjectStep | null
  progressPct: number
  startDate: string | null
  endDate: string | null
  delay: number | null
  done: number
  total: number
  referentName: string
}

/** Phrase d'état du masthead, dérivée des données réelles du projet. */
function phraseEtat(current: PortalProjectStep | null, hasSteps: boolean, pct: number): ReactNode {
  const pctNode = <span className="ps-num">{pct}&nbsp;%</span>
  if (!hasSteps) return <>Votre espace projet est prêt, la feuille de route arrive bientôt.</>
  if (!current) return <>Toutes les étapes sont terminées, votre projet est finalisé.</>
  const status = toStepStatus(current.status)
  if (status === 'blocked') return <>{current.label} attend une action de votre part pour reprendre.</>
  if (status === 'upcoming') return <>Prochaine étape {current.label}, votre projet est à {pctNode}.</>
  return <>{current.label} en cours, votre projet est à {pctNode}.</>
}

/**
 * « Une de revue » : kicker, titre display fluide, puis bande de méta dont
 * le filet supérieur est la barre d'avancement réelle du projet.
 */
export function Masthead({
  projectName, prestaLabel, hasSteps, current, progressPct,
  startDate, endDate, delay, done, total, referentName,
}: MastheadProps) {
  const barStyle = { '--ps-bar-w': `${progressPct}%` } as CSSProperties

  return (
    <header>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="ps-eyebrow">Suivi de projet</p>
        <p className="text-[12px] text-[var(--ps-fg-muted)]">
          {projectName} · {prestaLabel}
        </p>
      </div>
      <h1 className="ps-display-fluid max-w-[22ch] pt-6 text-[var(--ps-fg)] sm:pt-8">
        {phraseEtat(current, hasSteps, progressPct)}
      </h1>

      {/* Le filet supérieur de la méta est la barre d'avancement elle-même */}
      <div className="mt-10 h-0.5 w-full rounded-full bg-[var(--ps-primary-subtle)]" role="presentation">
        <div
          className="ps-progress-fill h-0.5 rounded-full bg-[var(--ps-primary)] transition-[width] duration-700"
          style={barStyle}
        />
      </div>
      <dl className="grid grid-cols-2 gap-y-5 border-b border-[var(--ps-border)] py-5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[var(--ps-border-soft)]">
        <Meta label="Démarré le" valeur={formatLong(startDate)} num />
        <Meta
          label="Livraison estimée"
          valeur={formatLong(endDate)}
          num
          hint={delay != null ? `Délai : ${delay} jour${delay > 1 ? 's' : ''}` : undefined}
        />
        <Meta label="Jalons terminés" valeur={`${done} sur ${total}`} num />
        <Meta label="Référent" valeur={referentName} />
      </dl>
    </header>
  )
}

// ── Cellule de méta d'en-tête (libellé sur valeur) ─────────────────
function Meta({ label, valeur, num, hint }: { label: string; valeur: string; num?: boolean; hint?: string }) {
  return (
    <div className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <dt className="ps-tiny">{label}</dt>
      <dd className={`mt-1 text-[14px] font-medium text-[var(--ps-fg)] ${num ? 'ps-num' : ''}`}>{valeur}</dd>
      {hint && <dd className="ps-num mt-0.5 text-[11px] text-[var(--ps-fg-muted)]">{hint}</dd>}
    </div>
  )
}
