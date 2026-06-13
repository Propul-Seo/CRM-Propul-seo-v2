import { useState, useCallback, useEffect } from 'react';
import { Loader2, ListTodo } from 'lucide-react';
import { usePersonalTasks } from '../../hooks/supabase/usePersonalTasksQuery';
import { usePersonalTasksCRUD } from '../../hooks/supabase/usePersonalTasksCRUD';
import { usePersonalTasksFilters } from './hooks/usePersonalTasksFilters';
import { PersonalTasksHeader, type TaskViewMode } from './components/PersonalTasksHeader';
import { PersonalTasksFilters } from './components/PersonalTasksFilters';
import { TaskKanbanBoard } from './components/TaskKanbanBoard';
import { TaskListView } from './components/TaskListView';
import { ScratchPadView } from './components/ScratchPadView';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import type { PersonalTask, PersonalTaskStatus, PersonalTaskUpdate } from '../../types/personalTasks';

const STORAGE_KEY = 'personal-tasks-view-mode';

function getInitialViewMode(): TaskViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'kanban' || stored === 'list' || stored === 'scratch') return stored;
  } catch { /* noop */ }
  return 'kanban';
}

export function PersonalTasks() {
  const { data: tasks, loading, refetch } = usePersonalTasks();
  const { createTask, updateTask, deleteTask } = usePersonalTasksCRUD();
  const filters = usePersonalTasksFilters(tasks);
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<TaskViewMode>(getInitialViewMode);

  const handleViewModeChange = useCallback((mode: TaskViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* noop */ }
  }, []);

  const handleClickTask = useCallback((task: PersonalTask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  }, []);

  const handleCreateTask = useCallback(async (title: string, status: PersonalTaskStatus) => {
    await createTask({ title, status, priority: 'medium', tags: [], description: null, deadline: null, assigned_to: null, created_by: null });
    refetch();
  }, [createTask, refetch]);

  const handleCreateNewTask = useCallback(async () => {
    await createTask({ title: 'Nouvelle tache', status: 'todo', priority: 'medium', tags: [], description: null, deadline: null, assigned_to: null, created_by: null });
    refetch();
  }, [createTask, refetch]);

  const handleUpdateTask = useCallback(async (id: string, updates: PersonalTaskUpdate) => {
    await updateTask(id, updates);
    refetch();
  }, [updateTask, refetch]);

  const handleDeleteTask = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteTask(id);
    if (result.success) refetch();
    return result.success;
  }, [deleteTask, refetch]);

  const handleToggleStatus = useCallback(async (id: string, done: boolean) => {
    await updateTask(id, { status: done ? 'done' : 'todo' });
    refetch();
  }, [updateTask, refetch]);

  // Keyboard shortcut: Ctrl+N / Cmd+N → new task
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        // Don't hijack if an input is focused
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        handleCreateNewTask();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCreateNewTask]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="p-3 rounded-2xl bg-violet-500/10">
          <ListTodo className="h-8 w-8 text-violet-500 animate-pulse" />
        </div>
        <p className="text-muted-foreground/50 text-sm">Chargement des taches...</p>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="p-6 space-y-5 h-full">
        <PersonalTasksHeader
          taskCount={0}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onCreateTask={handleCreateNewTask}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="p-4 rounded-2xl bg-violet-500/10">
            <ListTodo className="h-12 w-12 text-violet-500/40" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-foreground/80">Aucune tache</h3>
            <p className="text-sm text-muted-foreground/40">
              Creez votre premiere tache avec le bouton ci-dessus ou <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-border/30 text-xs font-mono">Ctrl+N</kbd>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 h-full">
      <PersonalTasksHeader
        taskCount={filters.filteredTasks.length}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onCreateTask={handleCreateNewTask}
      />
      <PersonalTasksFilters
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        tagFilter={filters.tagFilter}
        setTagFilter={filters.setTagFilter}
        priorityFilter={filters.priorityFilter}
        setPriorityFilter={filters.setPriorityFilter}
        deadlineFilter={filters.deadlineFilter}
        setDeadlineFilter={filters.setDeadlineFilter}
        sortBy={filters.sortBy}
        setSortBy={filters.setSortBy}
        allTags={filters.allTags}
        hasActiveFilters={filters.hasActiveFilters}
        resetFilters={filters.resetFilters}
      />
      {viewMode === 'kanban' && (
        <TaskKanbanBoard
          tasks={filters.filteredTasks}
          onRefresh={refetch}
          onClickTask={handleClickTask}
          onCreateTask={handleCreateTask}
          onToggleStatus={handleToggleStatus}
        />
      )}
      {viewMode === 'list' && (
        <TaskListView
          tasks={filters.filteredTasks}
          onClickTask={handleClickTask}
          onToggleStatus={handleToggleStatus}
        />
      )}
      {viewMode === 'scratch' && (
        <ScratchPadView
          tasks={filters.filteredTasks}
          onClickTask={handleClickTask}
          onCreateTask={handleCreateTask}
          onToggleStatus={handleToggleStatus}
        />
      )}
      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        allTags={filters.allTags}
        onClose={() => { setDetailOpen(false); setSelectedTask(null); }}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
