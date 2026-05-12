import { useState, useMemo, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useProjectsV2 } from '@/modules/ProjectsManagerV2/hooks/useProjectsV2'
import { supabase } from '@/lib/supabase'
import { ProjectsV3Header } from './components/ProjectsV3Header'
import { ProjectColumnV3 } from './components/ProjectColumnV3'
import { ProjectCardV3 } from './components/ProjectCardV3'
import { SortableProjectCardV3 } from './components/SortableProjectCardV3'
import { statusToColumn, V3_COLUMN_ORDER, type V3Column } from './utils/statusMapping'
import { getActivePoles, type V3Pole } from './utils/poleMapping'
import { useProjectDragDropV3 } from './hooks/useProjectDragDropV3'
import type { ProjectV2 } from '@/types/project-v2'

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
  const { projects, loading, updateProjectStatus } = useProjectsV2()

  const [filterUserId, setFilterUserId] = useState('')
  const [activePoles, setActivePoles] = useState<Set<V3Pole>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounced(searchQuery, 300)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    supabase.from('users').select('id, name').order('name').then(({ data }) => {
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

  const { activeProject, handleDragStart, handleDragEnd, handleDragCancel } =
    useProjectDragDropV3({ projects: filteredProjects, onStatusChange: updateProjectStatus })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
        onNewProject={() => {
          // TODO étape ultérieure : modal création (réutiliser celle de V2 ?)
          console.log('[ProjectsV3] new project — à brancher')
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
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
              >
                {items.map((project, index) => (
                  <SortableProjectCardV3
                    key={project.id}
                    project={project}
                    index={index}
                    onClick={() => navigate(`/projets-v3-preview/${project.id}`)}
                  />
                ))}
              </ProjectColumnV3>
            )
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeProject ? (
            <div className="rotate-1 scale-[1.03] shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
              <ProjectCardV3 project={activeProject} index={0} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
