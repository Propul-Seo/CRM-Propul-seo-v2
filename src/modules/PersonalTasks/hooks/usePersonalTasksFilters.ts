import { useState, useMemo } from 'react';
import type { PersonalTask, PersonalTaskPriority } from '../../../types/personalTasks';

export type SortBy = 'none' | 'deadline' | 'tag' | 'priority';
export type DeadlineFilter = 'all' | 'overdue' | 'this_week' | 'this_month' | 'no_deadline';

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function usePersonalTasksFilters(tasks: PersonalTask[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<PersonalTaskPriority | 'all'>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('none');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(t => t.tags?.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const today = startOfDay(new Date());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let result = tasks.filter(task => {
      if (task.status === 'archived') return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      // Tag filter
      if (tagFilter !== 'all') {
        if (!task.tags?.includes(tagFilter)) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        if (task.priority !== priorityFilter) return false;
      }

      // Deadline filter
      if (deadlineFilter !== 'all') {
        const dl = task.deadline ? startOfDay(new Date(task.deadline)) : null;
        switch (deadlineFilter) {
          case 'overdue':
            if (!dl || dl >= today || task.status === 'done') return false;
            break;
          case 'this_week':
            if (!dl || dl < today || dl > endOfWeek) return false;
            break;
          case 'this_month':
            if (!dl || dl < today || dl > endOfMonth) return false;
            break;
          case 'no_deadline':
            if (task.deadline) return false;
            break;
        }
      }

      return true;
    });

    // Sort
    if (sortBy !== 'none') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'deadline': {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          }
          case 'tag': {
            const tagA = (a.tags?.[0] || '').toLowerCase();
            const tagB = (b.tags?.[0] || '').toLowerCase();
            if (!tagA && !tagB) return 0;
            if (!tagA) return 1;
            if (!tagB) return -1;
            return tagA.localeCompare(tagB, 'fr');
          }
          case 'priority':
            return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [tasks, searchQuery, tagFilter, priorityFilter, deadlineFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setTagFilter('all');
    setPriorityFilter('all');
    setDeadlineFilter('all');
    setSortBy('none');
  };

  const hasActiveFilters = searchQuery !== '' || tagFilter !== 'all' || priorityFilter !== 'all' || deadlineFilter !== 'all' || sortBy !== 'none';

  return {
    searchQuery, setSearchQuery,
    tagFilter, setTagFilter,
    priorityFilter, setPriorityFilter,
    deadlineFilter, setDeadlineFilter,
    sortBy, setSortBy,
    allTags,
    filteredTasks,
    resetFilters,
    hasActiveFilters,
  };
}
