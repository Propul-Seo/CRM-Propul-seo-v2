import { AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { getTagColor, PRIORITY_COLORS } from '../types';
import type { PersonalTask } from '../../../types/personalTasks';

interface TaskCardProps {
  task: PersonalTask;
  isDragging?: boolean;
  onClick?: (task: PersonalTask) => void;
  onToggleStatus?: (id: string, done: boolean) => void;
}

const PRIORITY_RING: Record<string, string> = {
  low: 'border-slate-500/40',
  medium: 'border-blue-500/40',
  high: 'border-orange-500/40',
  urgent: 'border-red-500/50 shadow-[0_0_6px_rgba(239,68,68,0.15)]',
};

export function TaskCard({ task, isDragging, onClick, onToggleStatus }: TaskCardProps) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';

  return (
    <div
      className={`relative group rounded-xl border transition-all duration-200 overflow-hidden ${
        isDragging
          ? 'shadow-2xl scale-[1.03] opacity-90 border-violet-500/40'
          : isDone
            ? 'bg-[#13121f]/60 border-[#1e1d2d] opacity-70 hover:opacity-100'
            : `bg-[#1a1925] ${PRIORITY_RING[task.priority]} hover:bg-[#1f1e30] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-[1px]`
      }`}
      onClick={() => onClick?.(task)}
      style={{ cursor: 'pointer' }}
    >
      {/* Priority accent — top edge glow */}
      <div className={`h-[2px] w-full ${PRIORITY_COLORS[task.priority]}`} style={{ opacity: isDone ? 0.3 : 0.8 }} />

      <div className="p-3 space-y-2">
        {/* Row 1: checkbox + title */}
        <div className="flex items-start gap-2">
          {onToggleStatus && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, !isDone); }}
              className={`mt-0.5 w-[18px] h-[18px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all ${
                isDone
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-surface-2/50'
              }`}
              aria-label={isDone ? 'Rouvrir' : 'Terminer'}
            >
              {isDone && <CheckCircle2 className="w-3 h-3" />}
            </button>
          )}
          <h4 className={`text-sm font-medium leading-snug line-clamp-2 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </h4>
        </div>

        {/* Row 2: description preview */}
        {task.description && !isDone && (
          <p className="text-xs text-muted-foreground/60 line-clamp-1 pl-[26px]">
            {task.description}
          </p>
        )}

        {/* Row 3: tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-[26px]">
            {task.tags.slice(0, 3).map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className={`text-[9px] px-1.5 py-0 border ${getTagColor(tag)}`}
              >
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <span className="text-[9px] text-muted-foreground/50 self-center">+{task.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Row 4: metadata footer */}
        <div className="flex items-center justify-between pl-[26px]">
          {task.deadline ? (
            <div className={`flex items-center gap-1 text-[11px] ${
              isOverdue ? 'text-red-400 font-semibold' : 'text-muted-foreground/50'
            }`}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
          ) : <div />}

          {task.assigned_to && (
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500/80 to-purple-600/80 flex items-center justify-center ring-1 ring-black/20">
              <span className="text-[9px] font-bold text-white">A</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
