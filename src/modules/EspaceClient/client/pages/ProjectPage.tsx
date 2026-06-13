import { useMemo } from 'react'
import { FolderKanban } from 'lucide-react'
import { EmptyState } from '@/modules/EspaceClient/shared/components'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import {
  usePortalProjectSteps, usePortalDocuments,
} from '@/modules/EspaceClient/client/hooks/usePortalData'
import { usePortalProjectDetails } from '@/modules/EspaceClient/client/hooks/usePortalProjectDetails'
import { ProjectHeader } from './project-sections/header'
import { StepsCard } from './project-sections/steps-card'
import { DeliverablesSection } from './project-sections/deliverables'
import { ProjectSkeleton } from './project-sections/skeleton'
import { PRESTA_LABELS } from './project-sections/format'

/**
 * Page Projet du portail — forme compacte calquée sur l'aperçu du panneau
 * admin (couleurs Aurora) : en-tête 2 colonnes (identité | avancement),
 * puis jalons à gauche et activité + livrables à droite. Tient sur un écran.
 */
export function ProjectPage() {
  const { project } = usePortal()
  const steps = usePortalProjectSteps()
  const documents = usePortalDocuments()
  const { details } = usePortalProjectDetails()

  const loading = steps.loading || documents.loading
  const rows = steps.rows

  // ── Dérivés ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = rows.length || 1
    const done = rows.filter(s => s.status === 'completed').length
    const progressPct = Math.round((done / total) * 100)
    const current =
      rows.find(s => s.status === 'in_progress')
      ?? rows.find(s => s.status === 'blocked')
      ?? rows.find(s => s.status === 'upcoming')
      ?? null
    return { total: rows.length, done, progressPct, current }
  }, [rows])

  const startDate = details?.start_date ?? rows.find(s => s.date_start)?.date_start ?? null
  const endDate = details?.end_date ?? null
  const presta = details?.presta_type ?? []
  const prestaLabel = presta.length > 0 ? (PRESTA_LABELS[presta[0]] ?? presta[0]) : 'Projet'

  // Livrables = documents de type "deliverable" (ou audit/report)
  const deliverables = useMemo(
    () => documents.rows.filter(d => ['deliverable', 'audit', 'report'].includes(d.document_type)),
    [documents.rows],
  )

  if (loading) return <ProjectSkeleton />

  if (steps.error) {
    return (
      <div className="ps-fade-in">
        <p className="rounded-[var(--ps-radius-input)] bg-[var(--ps-danger-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--ps-danger-text)]">{steps.error}</p>
      </div>
    )
  }

  const hasSteps = rows.length > 0

  return (
    <div className="ps-fade-in space-y-4">
      <ProjectHeader
        projectName={project.name ?? 'Mon projet'}
        prestaLabel={prestaLabel}
        startDate={startDate}
        endDate={endDate}
        progressPct={stats.progressPct}
        done={stats.done}
        total={stats.total}
        current={hasSteps ? stats.current : null}
      />

      {hasSteps ? (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <StepsCard steps={rows} currentId={stats.current?.id ?? null} />
          <DeliverablesSection deliverables={deliverables} />
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="Pas encore d'étapes"
          body="Votre roadmap projet sera publiée ici dès que l'équipe l'aura validée."
        />
      )}
    </div>
  )
}
