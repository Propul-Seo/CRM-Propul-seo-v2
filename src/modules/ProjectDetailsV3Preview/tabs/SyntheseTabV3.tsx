import { QuickActionBar, ActivityTimeline, type ActivityRecord } from '@/components/activities-hub'
import { MetricCard } from '../components/MetricCard'
import { useProjectActivitiesV3 } from '../hooks/useProjectActivitiesV3'
import { PROJECT_V3_ACTIONS, PROJECT_V3_ALL_ACTIONS, PROJECT_V3_TIMELINE_STYLES } from '../activityConfig'
import type { ProjectV2, ActivityType } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

const formatBudget = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function SyntheseTabV3({ project }: Props) {
  const { activities, loading, addActivity, updateActivity, deleteActivity } = useProjectActivitiesV3(project.id)

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
      />

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Budget" value={formatBudget(project.budget)} />
          <MetricCard label="Progression" value={`${project.progress ?? 0}%`} valueColor="text-[#a78bfa]" />
          <MetricCard label="Score" value={`${project.completion_score ?? 0}%`} valueColor="text-[#22c55e]" />
          <MetricCard label="Échéance" value={formatDate(project.end_date)} valueColor="text-[#f59e0b]" />
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
              onUpdate={async (id, updates) => { await updateActivity(id, updates) }}
              onDelete={deleteActivity}
              emptyHint="Aucune activité — utilisez les boutons ci-dessus pour démarrer la timeline."
            />
          )}
        </div>
      </div>
    </div>
  )
}
