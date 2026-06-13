import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePostCard } from './SortablePostCard';
import { Badge } from '../../../components/ui/badge';
import type { PostRow, PostStatus } from '../../../types/supabase-types';

interface KanbanColumnProps {
  id: PostStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  posts: PostRow[];
  onViewPost?: (post: PostRow) => void;
  onEditPost?: (post: PostRow) => void;
  onDeletePost?: (post: PostRow) => void;
}

export function KanbanColumn({ id, title, icon: Icon, color, textColor, posts, onViewPost, onEditPost, onDeletePost }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column', columnId: id } });
  const postIds = posts.map(p => p.id);

  return (
    <div ref={setNodeRef} className={`flex flex-col rounded-xl min-w-[220px] md:min-w-[260px] lg:min-w-0 lg:flex-1 max-w-[320px] transition-all duration-200 ${color} ${isOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-1 scale-[1.01]' : ''}`}>
      <div className="flex items-center justify-between p-2.5 md:p-3 border-b border-border/30">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${textColor}`} />
          <h3 className={`font-semibold text-sm ${textColor}`}>{title}</h3>
        </div>
        <Badge variant="secondary" className="bg-surface-2/50 text-foreground text-xs">{posts.length}</Badge>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] md:max-h-[calc(100vh-300px)]">
        <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
          {posts.length === 0 ? (
            <div className={`flex items-center justify-center h-20 border-2 border-dashed rounded-lg ${isOver ? 'border-primary bg-primary/10' : 'border-border'} transition-colors duration-200`}>
              <p className="text-muted-foreground text-xs">{isOver ? 'Déposer ici' : 'Aucun post'}</p>
            </div>
          ) : (
            posts.map(post => (
              <SortablePostCard key={post.id} post={post} onView={onViewPost} onEdit={onEditPost} onDelete={onDeletePost} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
