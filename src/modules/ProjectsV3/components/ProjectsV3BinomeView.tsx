import { useMemo, useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  MeasuringStrategy,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Inbox, UserRound, AlertCircle, Play, Pause } from 'lucide-react'
import type { ProjectV2, ProjectStatusV2 } from '@/types/project-v2'
import { ProjectCardV3 } from './ProjectCardV3'
import { SortableProjectCardV3 } from './SortableProjectCardV3'
import { PROJECT_ASSIGNEES } from '../utils/projectAssignees'
import { statusToColumn } from '../utils/statusMapping'
import type { PortalHealth } from '../hooks/usePortalHealth'

const ETIENNE_LABEL = PROJECT_ASSIGNEES[0].label
const LYES_LABEL = PROJECT_ASSIGNEES[1].label

type OwnerKey = 'etienne' | 'lyes' | 'unassigned'
type ZoneState = 'en_cours' | 'en_pause'

const UNASSIGNED_ZONE = 'unassigned'
const zoneId = (owner: OwnerKey, state: ZoneState) => `${owner}__${state}`

/** État (en cours / en pause) d'un projet d'après son statut V2. */
function stateOf(project: ProjectV2): ZoneState {
  return statusToColumn(project.status) === 'actifs' ? 'en_cours' : 'en_pause'
}

/** Statut V2 cible quand on dépose dans une zone d'état (seulement si l'état change). */
function statusForState(state: ZoneState): ProjectStatusV2 {
  return state === 'en_cours' ? 'in_progress' : 'on_hold'
}

interface BinomeUser {
  id: string
  name: string
}

interface Props {
  projects: ProjectV2[]
  assignees: BinomeUser[]
  portalHealthByProjectId: Map<string, PortalHealth>
  allowedAssigneeIds: Set<string>
  assigneeLabelsById: Map<string, string>
  onProjectClick: (id: string) => void
  /** Persiste un déplacement (changement de responsable et/ou de statut). Retourne false si l'écriture échoue. */
  onMoveProject: (id: string, updates: Partial<ProjectV2>) => Promise<boolean>
}

export function ProjectsV3BinomeView({
  projects,
  assignees,
  portalHealthByProjectId,
  allowedAssigneeIds,
  assigneeLabelsById,
  onProjectClick,
  onMoveProject,
}: Props) {
  const etienneId = useMemo(() => assignees.find((u) => u.name === ETIENNE_LABEL)?.id ?? null, [assignees])
  const lyesId = useMemo(() => assignees.find((u) => u.name === LYES_LABEL)?.id ?? null, [assignees])

  // Miroir local pour l'optimistic update au drag&drop (rollback si l'écriture échoue).
  const [items, setItems] = useState<ProjectV2[]>(projects)
  useEffect(() => { setItems(projects) }, [projects])

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeProject = useMemo(() => items.find((p) => p.id === activeId) ?? null, [items, activeId])

  const ownerOf = useMemo(() => (project: ProjectV2): OwnerKey => {
    if (etienneId && project.assigned_to === etienneId) return 'etienne'
    if (lyesId && project.assigned_to === lyesId) return 'lyes'
    return 'unassigned'
  }, [etienneId, lyesId])

  const buckets = useMemo(() => {
    const acc = {
      etienne: { en_cours: [] as ProjectV2[], en_pause: [] as ProjectV2[] },
      lyes: { en_cours: [] as ProjectV2[], en_pause: [] as ProjectV2[] },
      unassigned: [] as ProjectV2[],
    }
    for (const p of items) {
      const owner = ownerOf(p)
      if (owner === 'unassigned') acc.unassigned.push(p)
      else acc[owner][stateOf(p)].push(p)
    }
    return acc
  }, [items, ownerOf])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointer = pointerWithin(args)
    return pointer.length > 0 ? pointer : rectIntersection(args)
  }

  const zoneIdOf = (project: ProjectV2): string => {
    const owner = ownerOf(project)
    return owner === 'unassigned' ? UNASSIGNED_ZONE : zoneId(owner, stateOf(project))
  }

  const resolveZone = (overId: string): string | null => {
    if (overId === UNASSIGNED_ZONE || overId.includes('__')) return overId
    const project = items.find((p) => p.id === overId)
    return project ? zoneIdOf(project) : null
  }

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const project = items.find((p) => p.id === active.id)
    if (!project) return

    const toZone = resolveZone(over.id as string)
    if (!toZone || toZone === zoneIdOf(project)) return

    const targetOwner: OwnerKey = toZone === UNASSIGNED_ZONE ? 'unassigned' : (toZone.split('__')[0] as OwnerKey)
    const targetState: ZoneState | null = toZone === UNASSIGNED_ZONE ? null : (toZone.split('__')[1] as ZoneState)

    const targetAssignedTo = targetOwner === 'etienne' ? etienneId : targetOwner === 'lyes' ? lyesId : null

    const updates: Partial<ProjectV2> = {}
    if ((project.assigned_to ?? null) !== targetAssignedTo) updates.assigned_to = targetAssignedTo
    if (targetState && targetState !== stateOf(project)) updates.status = statusForState(targetState)
    if (Object.keys(updates).length === 0) return

    const snapshot = project
    setItems((prev) => prev.map((p) => (p.id === project.id ? { ...p, ...updates } : p)))
    void onMoveProject(project.id, updates).then((ok) => {
      if (!ok) setItems((prev) => prev.map((p) => (p.id === project.id ? snapshot : p)))
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-6">
        {/* Bandeau « À attribuer » — zone de drop (désassigne) */}
        <UnassignedZone
          projects={buckets.unassigned}
          portalHealthByProjectId={portalHealthByProjectId}
          allowedAssigneeIds={allowedAssigneeIds}
          assigneeLabelsById={assigneeLabelsById}
          onProjectClick={onProjectClick}
        />

        {/* Deux colonnes : Etienne (gauche) / Lyes (droite) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <BinomeColumn
            owner="etienne"
            label={ETIENNE_LABEL}
            enCours={buckets.etienne.en_cours}
            enPause={buckets.etienne.en_pause}
            portalHealthByProjectId={portalHealthByProjectId}
            allowedAssigneeIds={allowedAssigneeIds}
            assigneeLabelsById={assigneeLabelsById}
            onProjectClick={onProjectClick}
          />
          <BinomeColumn
            owner="lyes"
            label={LYES_LABEL}
            enCours={buckets.lyes.en_cours}
            enPause={buckets.lyes.en_pause}
            portalHealthByProjectId={portalHealthByProjectId}
            allowedAssigneeIds={allowedAssigneeIds}
            assigneeLabelsById={assigneeLabelsById}
            onProjectClick={onProjectClick}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeProject ? (
          <div className="rotate-1 scale-[1.03] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
            <ProjectCardV3
              project={activeProject}
              index={0}
              allowedAssigneeIds={allowedAssigneeIds}
              assigneeLabelsById={assigneeLabelsById}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface ColumnProps {
  owner: OwnerKey
  label: string
  enCours: ProjectV2[]
  enPause: ProjectV2[]
  portalHealthByProjectId: Map<string, PortalHealth>
  allowedAssigneeIds: Set<string>
  assigneeLabelsById: Map<string, string>
  onProjectClick: (id: string) => void
}

function BinomeColumn({ owner, label, enCours, enPause, ...rest }: ColumnProps) {
  return (
    <section className="rounded-xl p-[14px] flex flex-col border border-[rgba(139,92,246,0.18)] bg-[#0f0b1e]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(139,92,246,0.18)]">
        <div className="flex items-center gap-2">
          <UserRound className="h-[14px] w-[14px] text-[#A78BFA]" />
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#ede9fe]">{label}</span>
        </div>
        <span className="text-[11px] font-semibold text-[#9ca3af] bg-[#070512] px-[7px] py-0.5 rounded-[10px] tabular-nums">
          {enCours.length + enPause.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DropZone zoneId={zoneId(owner, 'en_cours')} label="En cours" icon={Play} color="#10b981" projects={enCours} {...rest} />
        <DropZone zoneId={zoneId(owner, 'en_pause')} label="En pause" icon={Pause} color="#f59e0b" projects={enPause} {...rest} />
      </div>
    </section>
  )
}

interface DropZoneProps {
  zoneId: string
  label: string
  icon: typeof Play
  color: string
  projects: ProjectV2[]
  portalHealthByProjectId: Map<string, PortalHealth>
  allowedAssigneeIds: Set<string>
  assigneeLabelsById: Map<string, string>
  onProjectClick: (id: string) => void
}

function DropZone({ zoneId: id, label, icon: Icon, color, projects, portalHealthByProjectId, allowedAssigneeIds, assigneeLabelsById, onProjectClick }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className="rounded-lg p-2.5 min-h-[320px] border transition-colors duration-200"
      style={{
        background: isOver ? `${color}0D` : '#0a0814',
        borderColor: isOver ? color : 'rgba(139, 92, 246, 0.14)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
        <Icon className="h-3 w-3" style={{ color }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">{label}</span>
        <span className="text-[10px] font-semibold text-[#6b7280] tabular-nums">· {projects.length}</span>
      </div>
      <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        {projects.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-6 border border-dashed rounded-md"
            style={{ borderColor: isOver ? color : 'rgba(139, 92, 246, 0.14)', color: isOver ? color : '#6b7280' }}
          >
            <p className="text-[11px]">{isOver ? 'Déposez ici' : 'Aucun projet'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {projects.map((project, index) => (
              <SortableProjectCardV3
                key={project.id}
                project={project}
                index={index}
                onClick={() => onProjectClick(project.id)}
                allowedAssigneeIds={allowedAssigneeIds}
                assigneeLabelsById={assigneeLabelsById}
                portalHealth={portalHealthByProjectId.get(project.id)}
              />
            ))}
          </div>
        )}
      </SortableContext>
    </div>
  )
}

interface UnassignedZoneProps {
  projects: ProjectV2[]
  portalHealthByProjectId: Map<string, PortalHealth>
  allowedAssigneeIds: Set<string>
  assigneeLabelsById: Map<string, string>
  onProjectClick: (id: string) => void
}

function UnassignedZone({ projects, portalHealthByProjectId, allowedAssigneeIds, assigneeLabelsById, onProjectClick }: UnassignedZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_ZONE })
  if (projects.length === 0 && !isOver) return null
  return (
    <section
      ref={setNodeRef}
      className="rounded-xl border p-[14px] transition-colors duration-200"
      style={{
        background: isOver ? 'rgba(245,158,11,0.10)' : 'rgba(245,158,11,0.06)',
        borderColor: isOver ? '#f59e0b' : 'rgba(245,158,11,0.3)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-[14px] w-[14px] text-[#f59e0b]" />
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#ede9fe]">À attribuer</span>
        <span className="text-[11px] font-semibold text-[#9ca3af] bg-[#070512] px-[7px] py-0.5 rounded-[10px] tabular-nums">
          {projects.length}
        </span>
        <span className="text-[11px] text-[#9ca3af]">· glissez vers {ETIENNE_LABEL} ou {LYES_LABEL}</span>
      </div>
      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-4 text-[11px] text-[#f59e0b]">
          <Inbox className="h-4 w-4 mr-2 opacity-60" /> Déposez ici pour désassigner
        </div>
      ) : (
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <SortableProjectCardV3
                key={project.id}
                project={project}
                index={index}
                onClick={() => onProjectClick(project.id)}
                allowedAssigneeIds={allowedAssigneeIds}
                assigneeLabelsById={assigneeLabelsById}
                portalHealth={portalHealthByProjectId.get(project.id)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </section>
  )
}
