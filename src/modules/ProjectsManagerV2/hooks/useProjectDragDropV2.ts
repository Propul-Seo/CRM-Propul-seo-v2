import { useState, useCallback, useMemo } from 'react'
import { DragStartEvent, DragEndEvent, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import {
  UserPlus, FileText, Send, Play, Eye,
  CheckCircle, Wrench, Pause, Archive,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ProjectV2, ProjectStatusV2 } from '../../../types/project-v2'

export interface KanbanColumnConfigV2 {
  id: ProjectStatusV2
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  headerColor: string
  textColor: string
  projects: ProjectV2[]
}

export const COLUMN_CONFIG_V2: Omit<KanbanColumnConfigV2, 'projects'>[] = [
  { id: 'prospect',       title: 'Prospect',      icon: UserPlus,    color: 'bg-gray-900/30 border-gray-700',    headerColor: 'bg-gray-800/50',    textColor: 'text-gray-300' },
  { id: 'brief_received', title: 'Brief reçu',    icon: FileText,    color: 'bg-blue-900/30 border-blue-700',    headerColor: 'bg-blue-900/50',    textColor: 'text-blue-300' },
  { id: 'quote_sent',     title: 'Devis envoyé',  icon: Send,        color: 'bg-indigo-900/30 border-indigo-700',headerColor: 'bg-indigo-900/50',  textColor: 'text-indigo-300' },
  { id: 'in_progress',    title: 'En cours',      icon: Play,        color: 'bg-green-900/30 border-green-700',  headerColor: 'bg-green-900/50',   textColor: 'text-green-300' },
  { id: 'review',         title: 'Recette',       icon: Eye,         color: 'bg-orange-900/30 border-orange-700',headerColor: 'bg-orange-900/50',  textColor: 'text-orange-300' },
  { id: 'delivered',      title: 'Livré',         icon: CheckCircle, color: 'bg-teal-900/30 border-teal-700',    headerColor: 'bg-teal-900/50',    textColor: 'text-teal-300' },
  { id: 'maintenance',    title: 'Maintenance',   icon: Wrench,      color: 'bg-purple-900/30 border-purple-700',headerColor: 'bg-purple-900/50',  textColor: 'text-purple-300' },
  { id: 'on_hold',        title: 'En pause',      icon: Pause,       color: 'bg-yellow-900/30 border-yellow-700',headerColor: 'bg-yellow-900/50',  textColor: 'text-yellow-300' },
  { id: 'closed',         title: 'Clôturé',       icon: Archive,     color: 'bg-gray-800/30 border-gray-600',    headerColor: 'bg-gray-800/50',    textColor: 'text-gray-400' },
]

type PipelineValidator = (project: ProjectV2) => string | null

const PIPELINE_RULES: Partial<Record<ProjectStatusV2, PipelineValidator>> = {
  delivered: (project) => {
    if (project.progress < 80) return `Progression insuffisante (${project.progress}%) — Terminez la recette avant de livrer`
    return null
  },
  closed: (project) => {
    if (project.progress < 100) return 'Le projet doit être à 100% avant clôture'
    return null
  },
}

interface UseProjectDragDropV2Props {
  projects: ProjectV2[]
  onStatusChange: (id: string, newStatus: ProjectStatusV2) => void
}

interface UseProjectDragDropV2Return {
  columns: KanbanColumnConfigV2[]
  activeProject: ProjectV2 | null
  activeColumn: ProjectStatusV2 | null
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

export function useProjectDragDropV2({ projects, onStatusChange }: UseProjectDragDropV2Props): UseProjectDragDropV2Return {
  const [activeProject, setActiveProject] = useState<ProjectV2 | null>(null)
  const [activeColumn, setActiveColumn] = useState<ProjectStatusV2 | null>(null)

  const columns = useMemo<KanbanColumnConfigV2[]>(() => {
    return COLUMN_CONFIG_V2.map(col => ({
      ...col,
      projects: projects.filter(p => p.status === col.id),
    }))
  }, [projects])

  const findColumn = useCallback((projectId: UniqueIdentifier): ProjectStatusV2 | null => {
    return projects.find(p => p.id === projectId)?.status ?? null
  }, [projects])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const project = projects.find(p => p.id === event.active.id)
    if (project) { setActiveProject(project); setActiveColumn(project.status) }
  }, [projects])

  const handleDragOver = useCallback((_event: DragOverEvent) => {}, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null); setActiveColumn(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const fromColumn = activeColumn
    let toColumn = findColumn(overId)
    if (!toColumn && COLUMN_CONFIG_V2.some(col => col.id === overId)) toColumn = overId as ProjectStatusV2
    if (!fromColumn || !toColumn || fromColumn === toColumn) return

    const project = projects.find(p => p.id === activeId)
    if (!project) return

    const rule = PIPELINE_RULES[toColumn]
    if (rule) {
      const err = rule(project)
      if (err) { toast.error(err); return }
    }

    onStatusChange(activeId, toColumn)
    toast.success(`"${project.name}" → ${COLUMN_CONFIG_V2.find(c => c.id === toColumn)?.title}`)
  }, [activeColumn, findColumn, projects, onStatusChange])

  const handleDragCancel = useCallback(() => {
    setActiveProject(null); setActiveColumn(null)
  }, [])

  return { columns, activeProject, activeColumn, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel }
}
