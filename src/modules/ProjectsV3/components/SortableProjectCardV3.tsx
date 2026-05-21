import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ProjectV2 } from '@/types/project-v2'
import { ProjectCardV3 } from './ProjectCardV3'
import type { PortalHealth } from '../hooks/usePortalHealth'

interface Props {
  project: ProjectV2
  index: number
  onClick?: () => void
  portalHealth?: PortalHealth
}

/**
 * Wrapper sortable autour de ProjectCardV3.
 * - Pendant le drag, la carte source devient semi-transparente.
 * - Le clic ne déclenche que si le drag n'a pas eu lieu (handled by @dnd-kit activationConstraint).
 */
export function SortableProjectCardV3({ project, index, onClick, portalHealth }: Props) {
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
      <ProjectCardV3 project={project} index={index} onClick={onClick} portalHealth={portalHealth} />
    </div>
  )
}
