import { Check } from 'lucide-react'
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { ActiveStepCard, ProjectDoneCard } from './active-step'
import { STATUT_LIBELLE, STATUT_TEXTE, formatJour, stepDate, toStepStatus } from './format'

interface ProjectTimelineProps {
  steps: PortalProjectStep[]
  /** Id du jalon actif (en cours / bloqué / à venir), null si projet terminé. */
  currentId: string | null
  referentName: string
}

/**
 * Frise éditoriale : dates et statuts en marginalia contre la hairline
 * verticale ; le jalon actif est rendu en carte riche, les autres en lignes.
 */
export function ProjectTimeline({ steps, currentId, referentName }: ProjectTimelineProps) {
  return (
    <ol className="mt-10 sm:mt-14">
      {steps.map(step =>
        step.id === currentId ? (
          <ActiveStepCard key={step.id} step={step} referentName={referentName} />
        ) : (
          <EtapeLigne key={step.id} step={step} />
        ),
      )}
      {currentId === null && <ProjectDoneCard />}
    </ol>
  )
}

// ── Étape ordinaire : date en marge droite-alignée, marqueur sur la ligne ──
function EtapeLigne({ step }: { step: PortalProjectStep }) {
  const status = toStepStatus(step.status)
  const fait = status === 'completed'
  return (
    <li className="grid gap-1.5 py-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-0 sm:py-0">
      <div className="flex items-baseline gap-3 sm:block sm:pr-10 sm:pt-6 sm:text-right">
        <p className="ps-num text-[13px] font-medium text-[var(--ps-fg)]">{formatJour(stepDate(step))}</p>
        <p className={`text-[12px] font-medium sm:mt-0.5 ${STATUT_TEXTE[status]}`}>
          {STATUT_LIBELLE[status]}
        </p>
      </div>
      <div className="relative sm:border-l sm:border-[var(--ps-border)] sm:py-6 sm:pl-10">
        <span
          className="absolute top-[27px] hidden h-[18px] w-[18px] -translate-x-1/2 items-center justify-center rounded-full bg-[var(--ps-bg)] sm:left-0 sm:flex"
          aria-hidden
        >
          {fait ? (
            <Check className="h-3.5 w-3.5 text-[var(--ps-success)]" strokeWidth={2.5} />
          ) : status === 'blocked' ? (
            <span className="h-2 w-2 rounded-full bg-[var(--ps-danger)]" />
          ) : (
            <span className="h-2 w-2 rounded-full border border-[var(--ps-border-strong)] bg-[var(--ps-bg)]" />
          )}
        </span>
        <h2
          className={`text-[16px] leading-[24px] [font-family:var(--ps-font-display)] ${
            fait ? 'font-medium text-[var(--ps-fg)]' : 'font-normal text-[var(--ps-fg-secondary)]'
          }`}
        >
          {step.label}
        </h2>
        {step.description && (
          <p className="mt-1 max-w-[62ch] text-[13px] leading-[20px] text-[var(--ps-fg-secondary)]">
            {step.description}
          </p>
        )}
      </div>
    </li>
  )
}
