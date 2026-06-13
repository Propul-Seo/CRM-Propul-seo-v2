import { ListTodo, Plus, LayoutGrid, List, PenLine } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

export type TaskViewMode = 'kanban' | 'list' | 'scratch';

interface PersonalTasksHeaderProps {
  taskCount: number;
  viewMode: TaskViewMode;
  onViewModeChange: (mode: TaskViewMode) => void;
  onCreateTask: () => void;
}

const VIEW_MODES: { id: TaskViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'kanban',  label: 'Kanban',  icon: LayoutGrid },
  { id: 'list',    label: 'Liste',   icon: List },
  { id: 'scratch', label: 'Scratch', icon: PenLine },
];

export function PersonalTasksHeader({ taskCount, viewMode, onViewModeChange, onCreateTask }: PersonalTasksHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg">
          <ListTodo className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes Tâches</h1>
          <p className="text-sm text-muted-foreground">{taskCount} tâche{taskCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center bg-surface-2 rounded-lg p-0.5 border border-border/30">
          {VIEW_MODES.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onViewModeChange(mode.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === mode.id
                    ? 'bg-surface-3 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>

        <Button onClick={onCreateTask} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>
    </div>
  );
}
