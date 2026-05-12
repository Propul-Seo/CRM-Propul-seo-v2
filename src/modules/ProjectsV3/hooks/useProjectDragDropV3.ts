import { useState, useCallback } from 'react'
import type { DragStartEvent, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core'
import { toast } from 'sonner'
import type { ProjectV2, ProjectStatusV2 } from '@/types/project-v2'
import { statusToColumn, columnToDefaultStatus, V3_COLUMN_ORDER, V3_COLUMN_LABELS, type V3Column } from '../utils/statusMapping'

interface UseProjectDragDropV3Props {
  projects: ProjectV2[]
  onStatusChange: (id: string, newStatus: ProjectStatusV2) => Promise<void> | void
}

interface UseProjectDragDropV3Return {
  activeProject: ProjectV2 | null
  activeColumn: V3Column | null
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

/**
 * Drag & drop V3 : 3 colonnes agrégées (Planification / En cours / En pause).
 * Quand un projet est déplacé dans une colonne, on lui assigne le statut V2 par défaut
 * de cette colonne (brief_received / in_progress / on_hold).
 */
export function useProjectDragDropV3({ projects, onStatusChange }: UseProjectDragDropV3Props): UseProjectDragDropV3Return {
  const [activeProject, setActiveProject] = useState<ProjectV2 | null>(null)
  const [activeColumn, setActiveColumn] = useState<V3Column | null>(null)

  const findColumn = useCallback((id: UniqueIdentifier): V3Column | null => {
    // L'id peut être un projet ou directement une colonne (drop sur zone vide)
    const projectMatch = projects.find(p => p.id === id)
    if (projectMatch) return statusToColumn(projectMatch.status)
    if (typeof id === 'string' && V3_COLUMN_ORDER.includes(id as V3Column)) return id as V3Column
    return null
  }, [projects])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const project = projects.find(p => p.id === event.active.id)
    if (project) {
      setActiveProject(project)
      setActiveColumn(statusToColumn(project.status))
    }
  }, [projects])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)
    setActiveColumn(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const fromColumn = findColumn(activeId)
    const toColumn = findColumn(overId)
    if (!fromColumn || !toColumn || fromColumn === toColumn) return

    const project = projects.find(p => p.id === activeId)
    if (!project) return

    const newStatus = columnToDefaultStatus(toColumn)
    void Promise.resolve(onStatusChange(activeId, newStatus)).then(() => {
      toast.success(`"${project.name}" → ${V3_COLUMN_LABELS[toColumn]}`)
    }).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Échec du déplacement')
    })
  }, [findColumn, projects, onStatusChange])

  const handleDragCancel = useCallback(() => {
    setActiveProject(null)
    setActiveColumn(null)
  }, [])

  return { activeProject, activeColumn, handleDragStart, handleDragEnd, handleDragCancel }
}
