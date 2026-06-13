import { useState } from 'react'
import { Phone, Mail, Calendar, FileText, CheckCircle, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CRMERPActivity, ActivityType } from '../types'
import { ACTIVITY_TYPES } from '../types'
import { ActivityModal } from './modals/ActivityModal'

const TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  call: Phone, email: Mail, meeting: Calendar, note: FileText, task: CheckCircle,
}

const TYPE_COLORS: Record<ActivityType, { avatar: string; badge: string }> = {
  call:    { avatar: 'bg-blue-500/15 border-blue-500/25 text-blue-400',    badge: 'bg-blue-500/15 text-blue-400 border-transparent' },
  email:   { avatar: 'bg-green-500/15 border-green-500/25 text-green-400', badge: 'bg-green-500/15 text-green-400 border-transparent' },
  meeting: { avatar: 'bg-amber-500/15 border-amber-500/25 text-amber-400', badge: 'bg-amber-500/15 text-amber-400 border-transparent' },
  note:    { avatar: 'bg-violet-500/15 border-violet-500/25 text-violet-400', badge: 'bg-violet-500/15 text-violet-400 border-transparent' },
  task:    { avatar: 'bg-teal-500/15 border-teal-500/25 text-teal-400',    badge: 'bg-teal-500/15 text-teal-400 border-transparent' },
}

function groupActivities(activities: CRMERPActivity[]) {
  const byDate = new Map<string, CRMERPActivity[]>()
  activities.forEach(a => {
    const key = format(new Date(a.created_at), 'MMMM yyyy', { locale: fr })
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(a)
  })
  return Array.from(byDate.entries()).map(([label, items]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    items,
  }))
}

function ActivityItem({
  activity, onUpdate, onDelete,
}: {
  activity: CRMERPActivity
  onUpdate: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const Icon = TYPE_ICONS[activity.type] ?? FileText
  const colors = TYPE_COLORS[activity.type] ?? TYPE_COLORS.note
  const typeLabel = ACTIVITY_TYPES.find(t => t.value === activity.type)?.label ?? activity.type

  return (
    <>
      <div className="flex gap-3 group py-3 px-1">
        <div className={cn('h-8 w-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5', colors.avatar)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn('text-[10px] font-semibold px-1.5 py-0', colors.badge)}>
              {typeLabel}
            </Badge>
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-[#9ca3af] flex items-center gap-0.5 hover:text-[#ede9fe] transition-colors"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
            </button>
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 hover:text-destructive"
                onClick={async () => {
                  if (window.confirm('Supprimer cette activité ?')) await onDelete(activity.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {expanded && (
            <>
              {activity.content && (
                <p className="text-xs text-[#ede9fe] leading-relaxed whitespace-pre-wrap">{activity.content}</p>
              )}
              {activity.creator && (
                <p className="text-[10px] text-[#9ca3af] mt-1">Par {activity.creator.name}</p>
              )}
            </>
          )}
        </div>
      </div>

      <ActivityModal
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={async (type, content) => { await onUpdate(activity.id, { type, content }); setEditing(false) }}
        activity={activity}
      />
    </>
  )
}

interface Props {
  activities: CRMERPActivity[]
  onUpdate: (id: string, updates: { type?: ActivityType; content?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ActivityTimeline({ activities, onUpdate, onDelete }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-[#9ca3af] text-sm">
        Aucune activité — utilisez les boutons ci-dessus pour en créer une.
      </div>
    )
  }

  const groups = groupActivities(activities)

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2 px-1">
            {group.label}
          </p>
          <div className="bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-xl divide-y divide-[rgba(139,92,246,0.1)] px-3">
            {group.items.map(a => (
              <ActivityItem key={a.id} activity={a} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
