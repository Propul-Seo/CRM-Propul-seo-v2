import { ArrowRight, Check } from 'lucide-react'
import { StatusBadge } from '@/modules/EspaceClient/shared/components'
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { TEAM_MAILTO, formatJour, formatLong, toStepStatus } from './format'

interface ActiveStepCardProps {
  step: PortalProjectStep
  referentName: string
}

/**
 * L'étape active = LA carte riche de la frise (seule surface élevée).
 * Reprend la logique du NextStepCard historique : en cours / à venir /
 * bloqué (rouge sémantique) + CTA mailto « Échanger sur cette étape ».
 */
export function ActiveStepCard({ step, referentName }: ActiveStepCardProps) {
  const status = toStepStatus(step.status)
  const blocked = status === 'blocked'
  const eyebrow = blocked
    ? 'Action attendue de votre part'
    : status === 'upcoming'
      ? 'Prochaine étape'
      : 'En cours en ce moment'

  return (
    <li className="my-4 sm:my-6">
      <div className="ps-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="min-w-0">
            <p
              className={`flex items-center gap-2 text-[12px] font-semibold ${
                blocked ? 'text-[var(--ps-danger-text)]' : 'text-[var(--ps-primary-text)]'
              }`}
            >
              <span
                className={`ps-pulse h-2 w-2 rounded-full ${blocked ? 'bg-[var(--ps-danger)]' : 'bg-[var(--ps-primary)]'}`}
                aria-hidden
              />
              {eyebrow}
            </p>
            <h2 className="mt-3 text-[20px] font-semibold leading-[28px] tracking-[-0.02em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
              {step.label}
            </h2>
            {step.description && <p className="ps-body mt-2 max-w-[58ch]">{step.description}</p>}
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-x-10 gap-y-4 sm:block sm:space-y-4 sm:text-right">
            <div>
              <dt className="ps-tiny">Échéance</dt>
              <dd className="ps-num mt-1 text-[14px] font-medium text-[var(--ps-fg)]">
                {formatJour(step.date_planned_end)}
              </dd>
            </div>
            <div>
              <dt className="ps-tiny">Référent</dt>
              <dd className="mt-1 text-[14px] font-medium text-[var(--ps-fg)]">{referentName}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-[var(--ps-border-soft)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={step.status} />
            {step.date_start && (
              <p className="ps-small ps-num">Démarrée le {formatLong(step.date_start)}</p>
            )}
          </div>
          <a
            href={TEAM_MAILTO}
            className="group ps-tap inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--ps-radius-input)] bg-[var(--ps-primary)] px-5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--ps-primary-hover)] sm:w-auto"
          >
            Échanger sur cette étape
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </li>
  )
}

/** Variante « Projet finalisé » : toutes les étapes sont terminées. */
export function ProjectDoneCard() {
  return (
    <li className="my-4 sm:my-6">
      <div className="ps-surface flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.02em] text-[var(--ps-fg)] [font-family:var(--ps-font-display)]">
            Projet finalisé
          </h2>
          <p className="ps-small mt-1">Toutes les étapes sont terminées. Merci de votre confiance !</p>
        </div>
      </div>
    </li>
  )
}
