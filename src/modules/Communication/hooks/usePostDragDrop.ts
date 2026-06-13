import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { Lightbulb, PenLine, CheckCircle, Clock, Send } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import type { PostRow, PostStatus } from '../../../types/supabase-types';
import type { KanbanColumn } from '../types';

interface UsePostDragDropProps {
  initialPosts: PostRow[];
  onUpdate?: () => void;
}

const COLUMN_CONFIG = [
  {
    id: 'idea' as PostStatus,
    title: 'Idee',
    icon: Lightbulb,
    color: 'glass-surface-static',
    textColor: 'text-amber-400',
  },
  {
    id: 'drafting' as PostStatus,
    title: 'En redaction',
    icon: PenLine,
    color: 'glass-surface-static',
    textColor: 'text-blue-400',
  },
  {
    id: 'review' as PostStatus,
    title: 'En validation',
    icon: CheckCircle,
    color: 'glass-surface-static',
    textColor: 'text-purple-400',
  },
  {
    id: 'scheduled' as PostStatus,
    title: 'Programme',
    icon: Clock,
    color: 'glass-surface-static',
    textColor: 'text-indigo-400',
  },
  {
    id: 'published' as PostStatus,
    title: 'Publie',
    icon: Send,
    color: 'glass-surface-static',
    textColor: 'text-green-400',
  },
];

export { COLUMN_CONFIG };

export function usePostDragDrop({ initialPosts, onUpdate }: UsePostDragDropProps) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [activePost, setActivePost] = useState<PostRow | null>(null);
  const [activeColumn, setActiveColumn] = useState<PostStatus | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const columns = useMemo<KanbanColumn[]>(() => {
    return COLUMN_CONFIG.map(col => ({
      ...col,
      posts: posts.filter(p => p.status === col.id),
    }));
  }, [posts]);

  const findColumn = useCallback((postId: UniqueIdentifier): PostStatus | null => {
    const post = posts.find(p => p.id === postId);
    return post ? post.status as PostStatus : null;
  }, [posts]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const post = posts.find(p => p.id === active.id);
    if (post) {
      setActivePost(post);
      setActiveColumn(post.status as PostStatus);
    }
  }, [posts]);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // No optimistic updates
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    setActivePost(null);
    setActiveColumn(null);

    if (!over) {
      onUpdate?.();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = activeColumn;
    let overColumnId = findColumn(overId);

    if (!overColumnId && COLUMN_CONFIG.some(col => col.id === overId)) {
      overColumnId = overId as PostStatus;
    }

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return;
    }

    try {
      const updateData: Record<string, unknown> = {
        status: overColumnId,
        updated_at: new Date().toISOString(),
      };

      if (overColumnId === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', activeId);

      if (error) {
        toast.error('Erreur lors du changement de statut');
        onUpdate?.();
        return;
      }

      toast.success('Statut du post mis a jour');
      onUpdate?.();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
      onUpdate?.();
    }
  }, [activeColumn, findColumn, onUpdate]);

  const handleDragCancel = useCallback(() => {
    setActivePost(null);
    setActiveColumn(null);
    onUpdate?.();
  }, [onUpdate]);

  return {
    columns,
    activePost,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
