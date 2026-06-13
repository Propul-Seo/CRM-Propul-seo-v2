import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, MeasuringStrategy } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { usePostDragDrop } from '../hooks/usePostDragDrop';
import type { PostRow } from '../../../types/supabase-types';

interface KanbanBoardProps {
  posts: PostRow[];
  onRefresh: () => void;
  onViewPost: (post: PostRow) => void;
  onEditPost: (post: PostRow) => void;
  onDeletePost: (post: PostRow) => void;
}

export function KanbanBoard({ posts, onRefresh, onViewPost, onEditPost, onDeletePost }: KanbanBoardProps) {
  const { columns, activePost, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } = usePostDragDrop({ initialPosts: posts, onUpdate: onRefresh });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const measuring = { droppable: { strategy: MeasuringStrategy.Always } };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} measuring={measuring} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {columns.map(column => (
          <KanbanColumn key={column.id} id={column.id} title={column.title} icon={column.icon} color={column.color} textColor={column.textColor} posts={column.posts} onViewPost={onViewPost} onEditPost={onEditPost} onDeletePost={onDeletePost} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activePost ? <KanbanCard post={activePost} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
