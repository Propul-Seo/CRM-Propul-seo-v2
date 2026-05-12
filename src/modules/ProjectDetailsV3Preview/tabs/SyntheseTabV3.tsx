import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { QuickActionBar, ActivityTimeline, type ActivityRecord } from '@/components/activities-hub'
import { MetricCard } from '../components/MetricCard'
import { useProjectActivitiesV3 } from '../hooks/useProjectActivitiesV3'
import { useIsProjectV3Admin } from '../hooks/useIsProjectV3Admin'
import { PROJECT_V3_ACTIONS, PROJECT_V3_ALL_ACTIONS, PROJECT_V3_TIMELINE_STYLES } from '../activityConfig'
import type { ProjectV2, ActivityType } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

const notifyEditPlaceholder = () => {
  toast.info("Édition du projet — disponible dans une prochaine version.")
}

const formatBudget = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PRIMER_PROMPTS: Array<{ type: ActivityType; label: string }> = [
  { type: 'decision', label: 'Première décision projet' },
  { type: 'call',     label: 'Premier appel client' },
  { type: 'meeting',  label: 'Réunion de lancement' },
]

export function SyntheseTabV3({ project }: Props) {
  const { activities, loading, addActivity, updateActivity, deleteActivity } = useProjectActivitiesV3(project.id)
  const { isAdmin } = useIsProjectV3Admin()

  const records: ActivityRecord<ActivityType>[] = activities.map((a) => ({
    id: a.id,
    type: a.type,
    content: a.content ?? '',
    created_at: a.created_at,
    author_name: a.author_name,
    is_auto: a.is_auto,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Quick actions */}
      <QuickActionBar
        actions={PROJECT_V3_ACTIONS}
        onAdd={async (type, content) => { await addActivity(type, content) }}
        showMore={false}
      />

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Budget"
            value={formatBudget(project.budget)}
            isEmpty={project.budget === null || project.budget === undefined}
            emptyAction="Ajouter un budget"
            onEmptyClick={notifyEditPlaceholder}
          />
          <MetricCard label="Progression" value={`${project.progress ?? 0}%`} valueColor="text-[#a78bfa]" />
          <MetricCard label="Score" value={`${project.completion_score ?? 0}%`} valueColor="text-[#22c55e]" />
          <MetricCard
            label="Échéance"
            value={formatDate(project.end_date)}
            valueColor="text-[#f59e0b]"
            isEmpty={!project.end_date}
            emptyAction="Définir une échéance"
            onEmptyClick={notifyEditPlaceholder}
          />
        </div>

        {/* Timeline d'activités */}
        <div>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-3 px-1">
            Activités du projet
          </p>
          {loading ? (
            <div className="text-center py-8 text-[#9ca3af] text-sm">Chargement…</div>
          ) : (
            <ActivityTimeline
              activities={records}
              actions={PROJECT_V3_ALL_ACTIONS}
              styleMap={PROJECT_V3_TIMELINE_STYLES}
              onUpdate={
                isAdmin
                  ? async (id, updates) => {
                      try {
                        await updateActivity(id, updates)
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Impossible de modifier l'activité")
                      }
                    }
                  : undefined
              }
              onDelete={isAdmin ? deleteActivity : undefined}
              emptyState={
                <div className="text-center py-10 px-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] mb-4">
                    <Sparkles className="h-7 w-7 text-[#A78BFA]" />
                  </div>
                  <p className="text-sm font-semibold text-[#ede9fe] mb-1">
                    Démarrez la timeline du projet
                  </p>
                  <p className="text-xs text-[#9ca3af] mb-5 max-w-sm mx-auto">
                    Gardez une trace des décisions, échanges et points-clés au fil de l'eau.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {PRIMER_PROMPTS.map((p) => (
                      <button
                        key={p.type}
                        onClick={async () => {
                          try {
                            await addActivity(p.type, p.label)
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Impossible d'ajouter l'activité")
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-[rgba(139,92,246,0.15)] text-[#A78BFA] border border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.25)] transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
