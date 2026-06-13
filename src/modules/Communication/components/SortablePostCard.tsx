import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanCard } from './KanbanCard';
import type { PostRow } from '../../../types/supabase-types';

interface SortablePostCardProps {
  post: PostRow;
  onView?: (post: PostRow) => void;
  onEdit?: (post: PostRow) => void;
  onDelete?: (post: PostRow) => void;
}

export function SortablePostCard({ post, onView, onEdit, onDelete }: SortablePostCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
    data: { type: 'post', post },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard post={post} isDragging={isDragging} onView={onView} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
