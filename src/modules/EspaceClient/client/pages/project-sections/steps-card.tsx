import { ArrowRight, Check } from 'lucide-react'
import { Badge } from '@/modules/EspaceClient/shared/components'
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { STATUT_LIBELLE, STATUT_TEXTE, TEAM_MAILTO, formatJour, stepDate, toStepStatus } from './format'

const DOT: Record<string, string> = {
  completed: 'bg-[var(--ps-success)]',
  in_progress: 'bg-[var(--ps-primary)]',
  upcoming: 'bg-[var(--ps-border-strong)]',
  blocked: 'bg-[var(--ps-danger)]',
}

interface StepsCardProps {
  steps: PortalProjectStep[]
  /** Id du jalon actif (en cours / bloqué / à venir), null si projet terminé. */
  currentId: string | null
}

/**
 * Jalons en carte compacte — même forme que la liste de jalons du panneau
 * admin (lignes scannables, dot + libellé FR, dates discrètes), couleurs
 * Aurora. Le jalon actif est la seule ligne enrichie (description + CTA).
 */
export function StepsCard({ steps, currentId }: StepsCardProps) {
  const done = steps.filter(s => toStepStatus(s.status) === 'completed').length
  return (
    <section className="ps-surface overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-5 py-3.5">
        <h2 className="ps-h3 text-[var(--ps-fg)]">Jalons du projet</h2>
        <Badge tone="gray" dot={false}><span className="ps-num">{done} / {steps.length} terminés</span></Badge>
      </header>
      <ol className="divide-y divide-[var(--ps-border-soft)]">
        {steps.map(step => (
          <StepRow key={step.id} step={step} active={step.id === currentId} />
        ))}
        {currentId === null && (
          <li className="flex items-center gap-3 bg-[var(--ps-success-subtle)] px-5 py-3">
            <Check className="h-4 w-4 shrink-0 text-[var(--ps-success-text)]" strokeWidth={2.5} />
            <p className="text-[13px] font-medium text-[var(--ps-success-text)]">
              Projet finalisé — toutes les étapes sont terminées.
            </p>
          </li>
        )}
      </ol>
    </section>
  )
}

function StepRow({ step, active }: { step: PortalProjectStep; active: boolean }) {
  const status = toStepStatus(step.status)
  const blocked = status === 'blocked'
  return (
    <li className={`px-5 py-3 ${active ? 'bg-[var(--ps-primary-subtle)]' : ''}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${DOT[status]} ${active && !blocked ? 'ps-pulse' : ''}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className={`text-[13.5px] font-medium leading-5 ${
            status === 'upcoming' && !active ? 'text-[var(--ps-fg-secondary)]' : 'text-[var(--ps-fg)]'
          }`}>
            {step.label}
          </p>
          {step.description && (
            <p className="mt-1 text-[12.5px] leading-[18px] text-[var(--ps-fg-secondary)]">
              {step.description}
            </p>
          )}
          {active && (
            <a
              href={TEAM_MAILTO}
              className="group mt-1.5 inline-flex min-h-[32px] items-center gap-1 text-[12.5px] font-semibold text-[var(--ps-primary-text)] hover:underline"
            >
              {blocked ? 'Action attendue — échanger avec l\'équipe' : 'Échanger sur cette étape'}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.25} />
            </a>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="ps-num text-[12px] text-[var(--ps-fg-muted)]">{formatJour(stepDate(step))}</p>
          <p className={`text-[12px] font-medium ${STATUT_TEXTE[status]}`}>{STATUT_LIBELLE[status]}</p>
        </div>
      </div>
    </li>
  )
}
