import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductionItem } from './ProductionItem'
import { PHASE_LABELS } from './constants'
import type { ChecklistItemV2, ChecklistPhase, ChecklistStatus } from '@/types/project-v2'

interface Props {
  phase: ChecklistPhase
  rootItems: ChecklistItemV2[]
  allItems: ChecklistItemV2[]
  progress: { total: number; done: number; percent: number }
  collapsed: boolean
  pendingIds?: Set<string>
  onToggle: () => void
  onCycleStatus: (id: string, current: ChecklistStatus) => void
  onAddSubTask: (parentId: string, title: string) => void
  onDelete: (id: string) => void
  canDelete?: boolean
}

export function ProductionPhase({
  phase,
  rootItems,
  allItems,
  progress,
  collapsed,
  pendingIds,
  onToggle,
  onCycleStatus,
  onAddSubTask,
  onDelete,
  canDelete = true,
}: Props) {
  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-3/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {collapsed
            ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
          <span className="text-sm font-semibold text-foreground">{PHASE_LABELS[phase]}</span>
          <span className="text-xs text-muted-foreground">{progress.done}/{progress.total}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progress.percent === 100 ? 'bg-green-500' : 'bg-primary',
              )}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">{progress.percent}%</span>
        </div>
      </button>

      {!collapsed && (
        <div className="divide-y divide-border/50">
          {rootItems.map((item) => (
            <ProductionItem
              key={item.id}
              item={item}
              subItems={allItems.filter((i) => i.parent_task_id === item.id)}
              pendingIds={pendingIds}
              onCycleStatus={onCycleStatus}
              onAddSubTask={onAddSubTask}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
