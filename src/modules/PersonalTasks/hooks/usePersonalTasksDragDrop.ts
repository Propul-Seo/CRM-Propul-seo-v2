import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { CircleDot, Timer, Sun } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import type { PersonalTask, PersonalTaskStatus } from '../../../types/personalTasks';
import type { TaskKanbanColumn } from '../types';

interface UsePersonalTasksDragDropProps {
  initialTasks: PersonalTask[];
  onUpdate?: () => void;
}

const COLUMN_CONFIG = [
  {
    id: 'todo' as PersonalTaskStatus,
    title: 'À faire',
    icon: CircleDot,
    color: 'glass-surface-static',
    textColor: 'text-blue-400',
  },
  {
    id: 'in_progress' as PersonalTaskStatus,
    title: 'En cours',
    icon: Timer,
    color: 'glass-surface-static',
    textColor: 'text-amber-400',
  },
  {
    id: 'weekend' as PersonalTaskStatus,
    title: 'Week-end',
    icon: Sun,
    color: 'glass-surface-static',
    textColor: 'text-orange-400',
  },
];

export { COLUMN_CONFIG };

export function usePersonalTasksDragDrop({ initialTasks, onUpdate }: UsePersonalTasksDragDropProps) {
  const [tasks, setTasks] = useState<PersonalTask[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<PersonalTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<PersonalTaskStatus | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const columns = useMemo<TaskKanbanColumn[]>(() => {
    return COLUMN_CONFIG.map(col => ({
      ...col,
      tasks: tasks.filter(t =>
        col.id === 'todo'
          ? t.status === 'todo' || t.status === 'backlog'
          : t.status === col.id
      ),
    }));
  }, [tasks]);

  const findColumn = useCallback((taskId: UniqueIdentifier): PersonalTaskStatus | null => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.status : null;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setActiveColumn(task.status);
    }
  }, [tasks]);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // No optimistic updates during drag over
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
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
      overColumnId = overId as PersonalTaskStatus;
    }

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === activeId ? { ...t, status: overColumnId! } : t
    ));

    try {
      const { error } = await supabase
        .from('personal_tasks')
        .update({
          status: overColumnId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeId);

      if (error) {
        toast.error('Erreur lors du changement de statut');
        onUpdate?.();
        return;
      }

      toast.success('Statut mis à jour');
      onUpdate?.();
    } catch {
      toast.error('Erreur lors du changement de statut');
      onUpdate?.();
    }
  }, [activeColumn, findColumn, onUpdate]);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setActiveColumn(null);
    onUpdate?.();
  }, [onUpdate]);

  return {
    columns,
    activeTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
