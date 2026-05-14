import { useState, useMemo, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  type CollisionDetection,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useProjectsV2 } from '@/modules/ProjectsManagerV2/hooks/useProjectsV2'
import { supabase } from '@/lib/supabase'
import { ProjectsV3Header, type V3ViewMode } from './components/ProjectsV3Header'
import { NewProjectModalV3 } from './components/NewProjectModalV3'
import { ProjectColumnV3 } from './components/ProjectColumnV3'
import { ProjectCardV3 } from './components/ProjectCardV3'
import { ProjectCardV3Compact } from './components/ProjectCardV3Compact'
import { SortableProjectCardV3 } from './components/SortableProjectCardV3'
import { SortableProjectCardV3Compact } from './components/SortableProjectCardV3Compact'
import { statusToColumn, V3_COLUMN_ORDER, type V3Column } from './utils/statusMapping'
import { getActivePoles, type V3Pole } from './utils/poleMapping'
import { useProjectDragDropV3 } from './hooks/useProjectDragDropV3'
import type { ProjectV2 } from '@/types/project-v2'

const VIEW_MODE_STORAGE_KEY = 'propulseo:projects-v3:view-mode'

function loadViewMode(): V3ViewMode {
  if (typeof window === 'undefined') return 'normal'
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
  return stored === 'compact' ? 'compact' : 'normal'
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function ProjectsV3Page() {
  const navigate = useNavigate()
  const { projects, loading, updateProjectStatus, addProject } = useProjectsV2()
  const [newOpen, setNewOpen] = useState(false)

  const [filterUserId, setFilterUserId] = useState('')
  const [activePoles, setActivePoles] = useState<Set<V3Pole>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounced(searchQuery, 300)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [viewMode, setViewMode] = useState<V3ViewMode>(loadViewMode)

  const handleViewModeChange = (mode: V3ViewMode) => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    }
  }

  useEffect(() => {
    supabase.from('users').select('id, name').order('name').then(({ data, error }) => {
      if (error) {
        console.error('[ProjectsV3] users fetch failed:', error)
        return
      }
      if (data) setUsers(data as { id: string; name: string }[])
    })
  }, [])

  const togglePole = (pole: V3Pole) => {
    setActivePoles(prev => {
      const next = new Set(prev)
      if (next.has(pole)) next.delete(pole)
      else next.add(pole)
      return next
    })
  }

  const filteredProjects = useMemo(() => {
    let result = projects
    if (filterUserId) {
      result = result.filter(p => p.assigned_to === filterUserId)
    }
    if (activePoles.size > 0) {
      result = result.filter(p => {
        const projectPoles = getActivePoles(p.presta_type)
        return projectPoles.some(pole => activePoles.has(pole))
      })
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.client_name ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [projects, filterUserId, activePoles, debouncedSearch])

  const byColumn = useMemo(() => {
    const acc: Record<V3Column, ProjectV2[]> = {
      planification: [],
      en_cours: [],
      en_pause: [],
    }
    for (const p of filteredProjects) {
      acc[statusToColumn(p.status)].push(p)
    }
    return acc
  }, [filteredProjects])

  const { activeProject, activeColumn, overColumn, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } =
    useProjectDragDropV3({ projects: filteredProjects, onStatusChange: updateProjectStatus })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /**
   * Stratégie de collision robuste pour kanban multi-containers :
   * 1. pointerWithin : retourne les droppables qui contiennent le pointeur
   *    → idéal quand on est nettement dans une colonne
   * 2. Fallback rectIntersection : si le pointeur n'est dans aucune zone
   *    (espace entre colonnes), prend l'intersection rectangulaire la plus proche
   */
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return rectIntersection(args)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#A78BFA]" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0a0814] text-[#ede9fe] p-8 max-w-[1600px] mx-auto">
      <ProjectsV3Header
        projectCount={filteredProjects.length}
        filterUserId={filterUserId}
        onFilterUserChange={setFilterUserId}
        users={users}
        activePoles={activePoles}
        onTogglePole={togglePole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewProject={() => setNewOpen(true)}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-3 gap-5">
          {V3_COLUMN_ORDER.map(column => {
            const items = byColumn[column]
            const itemIds = items.map(p => p.id)
            return (
              <ProjectColumnV3
                key={column}
                column={column}
                count={items.length}
                itemIds={itemIds}
                isEmpty={items.length === 0}
                compact={viewMode === 'compact'}
                isDragTarget={
                  activeProject !== null &&
                  overColumn === column &&
                  activeColumn !== column
                }
              >
                {items.map((project, index) => (
                  viewMode === 'compact' ? (
                    <SortableProjectCardV3Compact
                      key={project.id}
                      project={project}
                      index={index}
                      onClick={() => navigate(`/projets-v3-preview/${project.id}`)}
                    />
                  ) : (
                    <SortableProjectCardV3
                      key={project.id}
                      project={project}
                      index={index}
                      onClick={() => navigate(`/projets-v3-preview/${project.id}`)}
                    />
                  )
                ))}
              </ProjectColumnV3>
            )
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeProject ? (
            <div className="rotate-1 scale-[1.03] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
              {viewMode === 'compact' ? (
                <ProjectCardV3Compact project={activeProject} index={0} />
              ) : (
                <ProjectCardV3 project={activeProject} index={0} />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <NewProjectModalV3
        open={newOpen}
        users={users}
        onClose={() => setNewOpen(false)}
        onCreate={addProject}
      />
    </div>
  )
}
