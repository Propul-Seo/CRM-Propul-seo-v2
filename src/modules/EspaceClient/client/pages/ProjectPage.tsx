import { useMemo } from 'react'
import { FolderKanban } from 'lucide-react'
import { EmptyState } from '@/modules/EspaceClient/shared/components'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import {
  usePortalProjectSteps, usePortalDocuments, usePortalProjectActivities,
} from '@/modules/EspaceClient/client/hooks/usePortalData'
import { usePortalProjectDetails } from '@/modules/EspaceClient/client/hooks/usePortalProjectDetails'
import { ClientActivityTimeline } from '@/modules/EspaceClient/client/components/ClientActivityTimeline'
import { Masthead } from './project-sections/masthead'
import { ProjectTimeline } from './project-sections/timeline'
import { DeliverablesSection } from './project-sections/deliverables'
import { ReferentCard } from './project-sections/referent-card'
import { ClosureFooter } from './project-sections/closure'
import { ProjectSkeleton } from './project-sections/skeleton'
import { PRESTA_LABELS, daysBetween } from './project-sections/format'

/**
 * Page Projet du portail — composition « Éditorial calme » (direction A) :
 * une de revue (masthead + bande de méta sous filet-progression), frise
 * éditoriale dont l'étape active est la seule carte riche, compléments
 * (livrables, activité, référent) puis clôture.
 */
export function ProjectPage() {
  const { project } = usePortal()
  const steps = usePortalProjectSteps()
  const documents = usePortalDocuments()
  const activities = usePortalProjectActivities()
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
  const delay = daysBetween(startDate, endDate)
  const presta = details?.presta_type ?? []
  const prestaLabel = presta.length > 0 ? (PRESTA_LABELS[presta[0]] ?? presta[0]) : 'Projet'
  const referentName = details?.assigned_name ?? "Équipe Propul'SEO"

  // Livrables = documents de type "deliverable" (ou audit/report)
  const deliverables = useMemo(
    () => documents.rows.filter(d => ['deliverable', 'audit', 'report'].includes(d.document_type)),
    [documents.rows],
  )

  if (loading) return <ProjectSkeleton />

  if (steps.error) {
    return (
      <div className="ps-fade-in">
        <p className="rounded-md bg-[var(--ps-danger-subtle)] px-3 py-2 text-[13px] text-[var(--ps-danger-text)]">{steps.error}</p>
      </div>
    )
  }

  const hasSteps = rows.length > 0

  return (
    <div className="ps-fade-in mx-auto w-full max-w-[1080px]">
      <Masthead
        projectName={project.name ?? 'Mon projet'}
        prestaLabel={prestaLabel}
        hasSteps={hasSteps}
        current={stats.current}
        progressPct={stats.progressPct}
        startDate={startDate}
        endDate={endDate}
        delay={delay}
        done={stats.done}
        total={stats.total}
        referentName={referentName}
      />

      {hasSteps ? (
        <ProjectTimeline
          steps={rows}
          currentId={stats.current?.id ?? null}
          referentName={referentName}
        />
      ) : (
        <div className="mt-10 sm:mt-14">
          <EmptyState
            icon={FolderKanban}
            title="Pas encore d'étapes"
            body="Votre roadmap projet sera publiée ici dès que l'équipe l'aura validée."
          />
        </div>
      )}

      {/* ── Compléments : livrables, activité de l'équipe, référent ── */}
      <div className="mt-10 space-y-5 sm:mt-14">
        <DeliverablesSection deliverables={deliverables} />
        <ClientActivityTimeline activities={activities.rows} loading={activities.loading} />
        <ReferentCard name={referentName} />
      </div>

      <ClosureFooter current={stats.current} endDate={endDate} referentName={referentName} />
    </div>
  )
}
