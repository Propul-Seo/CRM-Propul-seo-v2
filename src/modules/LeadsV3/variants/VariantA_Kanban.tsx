import { useMemo, useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { LeadCardV3, type LeadCardData } from '../components/LeadCardV3'

interface KanbanColumn {
  id: string
  label: string
  color: string
}

interface Props {
  columns: KanbanColumn[]
  /** Map: leadId -> status (de la colonne courante). */
  leadStatus: Record<string, string>
  leads: LeadCardData[]
  onLeadClick: (id: string) => void
  onStatusChange: (id: string, newStatus: string) => Promise<void>
  /** Conversion lead → projet (bouton affiché uniquement si fourni + lead signé). */
  onConvert?: (data: LeadCardData) => void
  /** Prédicat pour savoir si un lead est éligible à la conversion (statut "signé"). */
  isLeadSigned?: (leadId: string) => boolean
  /** ID du lead en cours de conversion (loader sur le bouton concerné). */
  convertingId?: string | null
}

export function VariantA_Kanban({
  columns,
  leadStatus,
  leads,
  onLeadClick,
  onStatusChange,
  onConvert,
  isLeadSigned,
  convertingId,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  // Miroir local pour optimistic update : on déplace la carte immédiatement
  // côté UI, puis on confirme/rollback selon la réponse Supabase. Évite le
  // flash de retour à l'ancienne colonne le temps que le refetch finisse.
  const [localStatus, setLocalStatus] = useState<Record<string, string>>(leadStatus)
  useEffect(() => { setLocalStatus(leadStatus) }, [leadStatus])

  const activeLead = useMemo(() => leads.find(l => l.id === activeId) ?? null, [leads, activeId])

  const byColumn = useMemo(() => {
    const acc: Record<string, LeadCardData[]> = {}
    for (const col of columns) acc[col.id] = []
    for (const l of leads) {
      const status = localStatus[l.id]
      if (status && acc[status]) acc[status].push(l)
    }
    return acc
  }, [columns, leads, localStatus])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findColumn = useCallback((id: string): string | null => {
    if (columns.some(c => c.id === id)) return id
    return localStatus[id] ?? null
  }, [columns, localStatus])

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const leadId = active.id as string
    const from = findColumn(leadId)
    const to = findColumn(over.id as string)
    if (!from || !to || from === to) return

    // Optimistic update : on bouge la carte immédiatement dans le state local.
    setLocalStatus(prev => ({ ...prev, [leadId]: to }))

    void onStatusChange(leadId, to)
      .then(() => {
        const label = columns.find(c => c.id === to)?.label ?? to
        toast.success(`Lead déplacé → ${label}`)
      })
      .catch((err: unknown) => {
        // Rollback : on remet la carte dans sa colonne d'origine.
        setLocalStatus(prev => ({ ...prev, [leadId]: from }))
        toast.error(err instanceof Error ? err.message : 'Échec du déplacement')
      })
  }

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointer = pointerWithin(args)
    return pointer.length > 0 ? pointer : rectIntersection(args)
  }

  const colCount = columns.length
  const gridClass = colCount <= 3 ? 'grid-cols-3' : colCount === 4 ? 'grid-cols-4' : 'grid-cols-6'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={`grid ${gridClass} gap-4`}>
        {columns.map(col => (
          <KanbanColumnView
            key={col.id}
            column={col}
            items={byColumn[col.id] ?? []}
            onLeadClick={onLeadClick}
            onConvert={onConvert}
            isLeadSigned={isLeadSigned}
            convertingId={convertingId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeLead ? (
          <div className="rotate-1 scale-[1.03] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
            <LeadCardV3 data={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumnView({
  column,
  items,
  onLeadClick,
  onConvert,
  isLeadSigned,
  convertingId,
}: {
  column: KanbanColumn
  items: LeadCardData[]
  onLeadClick: (id: string) => void
  onConvert?: (data: LeadCardData) => void
  isLeadSigned?: (leadId: string) => boolean
  convertingId?: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const itemIds = items.map(i => i.id)

  return (
    <section
      ref={setNodeRef}
      className="rounded-xl p-[14px] min-h-[500px] flex flex-col transition-all duration-200 border"
      style={{
        background: isOver ? `${column.color}0D` : '#0f0b1e',
        borderColor: isOver ? column.color : 'rgba(139, 92, 246, 0.18)',
        boxShadow: isOver ? `inset 0 0 0 1px ${column.color}33` : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(139,92,246,0.18)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: column.color, boxShadow: `0 0 8px ${column.color}` }} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#ede9fe]">
            {column.label}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#9ca3af] bg-[#070512] px-[7px] py-0.5 rounded-[10px] tabular-nums">
          {items.length}
        </span>
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 border border-dashed rounded-lg"
            style={{ borderColor: isOver ? column.color : 'rgba(139, 92, 246, 0.18)', color: isOver ? column.color : '#6b7280' }}
          >
            <Inbox className="h-7 w-7 mb-2 opacity-40" />
            <p className="text-[12px]">{isOver ? 'Déposez ici' : 'Aucun lead'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map(lead => {
              const eligible = onConvert && isLeadSigned?.(lead.id)
              return (
                <SortableLead
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead.id)}
                  onConvert={eligible ? onConvert : undefined}
                  converting={convertingId === lead.id}
                />
              )
            })}
          </div>
        )}
      </SortableContext>
    </section>
  )
}

function SortableLead({
  lead,
  onClick,
  onConvert,
  converting,
}: {
  lead: LeadCardData
  onClick: () => void
  onConvert?: (data: LeadCardData) => void
  converting?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.35 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCardV3 data={lead} onClick={onClick} onConvert={onConvert} converting={converting} />
    </div>
  )
}
