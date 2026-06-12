import { FolderKanban } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { formatJour, formatLong } from './format'

interface ProjectHeaderProps {
  projectName: string
  prestaLabel: string
  startDate: string | null
  endDate: string | null
  progressPct: number
  done: number
  total: number
  /** Jalon actif (en cours / bloqué / à venir), null si projet terminé. */
  current: PortalProjectStep | null
}

/**
 * En-tête compact de la page Projet — même forme que l'aperçu du panneau
 * admin (encadré 2 colonnes : identité | avancement), couleurs Aurora.
 */
export function ProjectHeader({
  projectName, prestaLabel, startDate, endDate, progressPct, done, total, current,
}: ProjectHeaderProps) {
  const scheduleLine = [
    startDate ? `Démarré le ${formatLong(startDate)}` : null,
    endDate ? `livraison estimée le ${formatLong(endDate)}` : null,
  ].filter(Boolean).join(' · ') || null

  return (
    <section className="ps-surface p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
        {/* Identité projet (gauche) */}
        <div className="min-w-0">
          <p className="ps-eyebrow ps-eyebrow-muted">Projet</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ps-primary-subtle)]">
              <FolderKanban className="h-5 w-5 text-[var(--ps-primary)]" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1 className="ps-h2 truncate text-[var(--ps-fg)]">{projectName}</h1>
              <p className="ps-small truncate">{prestaLabel}</p>
            </div>
          </div>
          {scheduleLine && (
            <p className="ps-small ps-num mt-3 text-[var(--ps-fg-secondary)]">{scheduleLine}</p>
          )}
        </div>

        {/* Avancement (droite) */}
        <div className="lg:border-l lg:border-[var(--ps-border-soft)] lg:pl-6">
          <p className="ps-eyebrow ps-eyebrow-muted">Avancement</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)]">
            <div
              className="ps-progress-fill h-full rounded-full bg-[var(--ps-primary)]"
              style={{ '--ps-bar-w': `${progressPct}%` } as CSSProperties}
            />
          </div>
          <p className="ps-small ps-num mt-2 text-[var(--ps-fg)]">
            <span className="font-semibold">{done} sur {total}</span> jalons terminés · {progressPct} %
          </p>
          {current ? (
            <p className="ps-small mt-1 truncate text-[var(--ps-fg-secondary)]">
              Étape en cours : <span className="font-medium text-[var(--ps-fg)]">{current.label}</span>
              {current.date_planned_end && <> · échéance le {formatJour(current.date_planned_end)}</>}
            </p>
          ) : (
            <p className="ps-small mt-1 text-[var(--ps-success-text)]">Projet finalisé — merci de votre confiance.</p>
          )}
        </div>
      </div>
    </section>
  )
}
