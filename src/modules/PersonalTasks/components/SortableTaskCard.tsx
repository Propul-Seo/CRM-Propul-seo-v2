import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import type { PersonalTask } from '../../../types/personalTasks';

interface SortableTaskCardProps {
  task: PersonalTask;
  onClick?: (task: PersonalTask) => void;
  onToggleStatus?: (id: string, done: boolean) => void;
}

export function SortableTaskCard({ task, onClick, onToggleStatus }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} onClick={onClick} onToggleStatus={onToggleStatus} />
    </div>
  );
}
