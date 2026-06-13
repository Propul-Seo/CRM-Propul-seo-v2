import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronRight } from 'lucide-react';
import { SortableTaskCard } from './SortableTaskCard';
import { TaskCreateInline } from './TaskCreateInline';
import { Badge } from '../../../components/ui/badge';
import type { PersonalTask, PersonalTaskStatus } from '../../../types/personalTasks';

interface TaskKanbanColumnProps {
  id: PersonalTaskStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  tasks: PersonalTask[];
  onClickTask?: (task: PersonalTask) => void;
  onCreateTask: (title: string, status: PersonalTaskStatus) => void;
  onToggleStatus?: (id: string, done: boolean) => void;
  defaultCollapsed?: boolean;
}

export function TaskKanbanColumn({
  id, title, icon: Icon, color, textColor, tasks, onClickTask, onCreateTask, onToggleStatus, defaultCollapsed = false,
}: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column', columnId: id } });
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const taskIds = tasks.map(t => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl min-w-[280px] lg:min-w-0 lg:flex-1 max-w-[340px] transition-all duration-200 ${color} ${
        isOver ? 'ring-2 ring-violet-500/60 ring-offset-2 ring-offset-surface-1 scale-[1.01]' : ''
      }`}
    >
      {/* Column header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between p-3 border-b border-border/20 w-full text-left group/hdr hover:bg-surface-2/30 rounded-t-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
          <Icon className={`h-4 w-4 ${textColor}`} />
          <h3 className={`font-semibold text-sm ${textColor}`}>{title}</h3>
        </div>
        <Badge variant="secondary" className="bg-surface-2/50 text-foreground text-xs tabular-nums">
          {tasks.length}
        </Badge>
      </button>

      {/* Task list (collapsible) */}
      {!collapsed && (
        <>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-340px)]">
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {tasks.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl ${
                  isOver ? 'border-violet-500/50 bg-violet-500/5' : 'border-border/30'
                } transition-colors duration-200`}>
                  <Icon className={`h-5 w-5 mb-1 ${isOver ? 'text-violet-400' : 'text-muted-foreground/20'}`} />
                  <p className="text-muted-foreground/40 text-xs">
                    {isOver ? 'Deposer ici' : 'Aucune tache'}
                  </p>
                </div>
              ) : (
                tasks.map(task => (
                  <SortableTaskCard key={task.id} task={task} onClick={onClickTask} onToggleStatus={onToggleStatus} />
                ))
              )}
            </SortableContext>
          </div>
          <div className="p-2 border-t border-border/10">
            <TaskCreateInline status={id} onCreateTask={onCreateTask} />
          </div>
        </>
      )}
    </div>
  );
}
