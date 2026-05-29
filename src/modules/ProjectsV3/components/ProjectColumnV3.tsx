import { Clock, Play, Pause, Inbox, Sparkles, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { V3Column } from '../utils/statusMapping'
import { V3_COLUMN_LABELS } from '../utils/statusMapping'

interface Props {
  column: V3Column
  count: number
  itemIds: string[]
  children: ReactNode
  isEmpty: boolean
  /** True quand cette colonne est la cible logique du drag en cours, même si le pointeur survole une carte enfant. */
  isDragTarget?: boolean
  /** Mode compact = espacement vertical réduit entre les cartes. */
  compact?: boolean
}

const COLUMN_ICONS: Record<V3Column, LucideIcon> = {
  planification: Clock,
  en_cours: Play,
  en_pause: Pause,
  propulseo: Sparkles,
}

const COLUMN_ICON_COLORS: Record<V3Column, string> = {
  planification: '#8B5CF6',
  en_cours: '#10b981',
  en_pause: '#f59e0b',
  propulseo: '#ec4899',
}

export function ProjectColumnV3({ column, count, itemIds, children, isEmpty, isDragTarget = false, compact = false }: Props) {
  const Icon = COLUMN_ICONS[column]
  const iconColor = COLUMN_ICON_COLORS[column]

  const { setNodeRef, isOver } = useDroppable({ id: column })

  // Allumage : soit le pointeur est directement dans la colonne (isOver),
  // soit le DndContext nous indique que la cible logique = cette colonne
  // (cas où le pointeur est sur une carte enfant — isOver=false alors qu'on droppera bien ici)
  const highlighted = isOver || isDragTarget

  return (
    <section
      ref={setNodeRef}
      className="rounded-xl p-[14px] min-h-[500px] flex flex-col transition-all duration-200 border"
      style={{
        background: highlighted ? `${iconColor}0D` : '#0f0b1e',
        borderColor: highlighted ? iconColor : 'rgba(139, 92, 246, 0.18)',
        boxShadow: highlighted ? `inset 0 0 0 1px ${iconColor}33` : 'none',
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(139,92,246,0.18)]">
        <div className="flex items-center gap-2">
          <Icon className="h-[14px] w-[14px]" style={{ color: iconColor }} />
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#ede9fe]">
            {V3_COLUMN_LABELS[column]}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#9ca3af] bg-[#070512] px-[7px] py-0.5 rounded-[10px] tabular-nums">
          {count}
        </span>
      </div>

      {/* Cards (sortable context for in-column reordering + droppable target) */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {isEmpty ? (
          <div
            className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 border border-dashed rounded-lg transition-colors duration-200"
            style={{
              borderColor: highlighted ? iconColor : 'rgba(139, 92, 246, 0.18)',
              color: highlighted ? iconColor : '#6b7280',
            }}
          >
            <Inbox className="h-7 w-7 mb-2 opacity-40" />
            <p className="text-[12px]">{highlighted ? 'Déposez ici' : 'Aucun projet'}</p>
          </div>
        ) : (
          <div className={compact ? 'flex flex-col gap-1' : 'flex flex-col gap-2.5'}>
            {children}
          </div>
        )}
      </SortableContext>
    </section>
  )
}
