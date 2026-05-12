import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ProjectV2 } from '@/types/project-v2'
import { ProjectCardV3Compact } from './ProjectCardV3Compact'

interface Props {
  project: ProjectV2
  index: number
  onClick?: () => void
}

export function SortableProjectCardV3Compact({ project, index, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCardV3Compact project={project} index={index} onClick={onClick} />
    </div>
  )
}
