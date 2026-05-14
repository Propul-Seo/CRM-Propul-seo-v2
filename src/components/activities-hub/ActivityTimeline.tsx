import { useState } from 'react'
import { FileText, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ActionDef, ActivityRecord } from './types'
import { ActivityModal } from './ActivityModal'

interface TimelineStyle {
  avatar: string
  badge: string
}

function groupByMonth<T extends string>(activities: ActivityRecord<T>[]) {
  const byDate = new Map<string, ActivityRecord<T>[]>()
  activities.forEach((a) => {
    const key = format(new Date(a.created_at), 'MMMM yyyy', { locale: fr })
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(a)
  })
  return Array.from(byDate.entries()).map(([label, items]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    items,
  }))
}

interface ItemProps<T extends string> {
  activity: ActivityRecord<T>
  actions: ActionDef<T>[]
  styleMap: Record<T, TimelineStyle>
  onUpdate?: (id: string, updates: { type: T; content: string }) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

function ActivityItem<T extends string>({ activity, actions, styleMap, onUpdate, onDelete }: ItemProps<T>) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const action = actions.find((a) => a.type === activity.type)
  const Icon = action?.icon ?? FileText
  const style = styleMap[activity.type]
  const typeLabel = action?.label ?? activity.type

  return (
    <>
      <div className="flex gap-3 group py-3 px-1">
        <div className={cn('h-8 w-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5', style?.avatar)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn('text-[10px] font-semibold px-1.5 py-0', style?.badge)}>
              {typeLabel}
            </Badge>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-[10px] text-[#9ca3af] flex items-center gap-0.5 hover:text-[#ede9fe] transition-colors"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
            </button>
            {(onUpdate || onDelete) && (
              <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onUpdate && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-destructive"
                    onClick={async () => {
                      if (window.confirm('Supprimer cette activité ?')) await onDelete(activity.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {expanded && (
            <>
              {activity.content && (
                <p className="text-xs text-[#ede9fe] leading-relaxed whitespace-pre-wrap">{activity.content}</p>
              )}
              {activity.author_name && (
                <p className="text-[10px] text-[#9ca3af] mt-1">Par {activity.author_name}</p>
              )}
            </>
          )}
        </div>
      </div>

      {onUpdate && (
        <ActivityModal
          open={editing}
          onClose={() => setEditing(false)}
          onSubmit={async (type, content) => { await onUpdate(activity.id, { type, content }) }}
          actions={actions}
          defaultType={activity.type}
          initialContent={activity.content}
          mode="edit"
        />
      )}
    </>
  )
}

interface Props<T extends string> {
  activities: ActivityRecord<T>[]
  actions: ActionDef<T>[]
  styleMap: Record<T, TimelineStyle>
  onUpdate?: (id: string, updates: { type: T; content: string }) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  emptyHint?: string
  /** Si fourni, remplace le rendu d'empty state par défaut. */
  emptyState?: React.ReactNode
}

export function ActivityTimeline<T extends string>({
  activities,
  actions,
  styleMap,
  onUpdate,
  onDelete,
  emptyHint = 'Aucune activité — utilisez les boutons ci-dessus pour en créer une.',
  emptyState,
}: Props<T>) {
  if (activities.length === 0) {
    if (emptyState) return <>{emptyState}</>
    return <div className="text-center py-12 text-[#9ca3af] text-sm">{emptyHint}</div>
  }

  const groups = groupByMonth(activities)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2 px-1">
            {group.label}
          </p>
          <div className="bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded-xl divide-y divide-[rgba(139,92,246,0.1)] px-3">
            {group.items.map((a) => (
              <ActivityItem
                key={a.id}
                activity={a}
                actions={actions}
                styleMap={styleMap}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
