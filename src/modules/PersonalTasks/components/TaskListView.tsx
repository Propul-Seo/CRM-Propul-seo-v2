import { useState, useMemo } from 'react';
import { ChevronRight, AlertTriangle, Calendar, Tag, Flame, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { getTagColor, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../types';
import type { PersonalTask } from '../../../types/personalTasks';

type GroupBy = 'status' | 'tag' | 'priority' | 'deadline';

interface TaskListViewProps {
  tasks: PersonalTask[];
  onClickTask: (task: PersonalTask) => void;
  onToggleStatus: (id: string, done: boolean) => void;
}

const GROUP_OPTIONS: Record<GroupBy, { label: string; icon: typeof Tag }> = {
  status:   { label: 'Statut',    icon: Clock },
  tag:      { label: 'Tag',       icon: Tag },
  priority: { label: 'Priorite',  icon: Flame },
  deadline: { label: 'Echeance',  icon: Calendar },
};

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = { in_progress: 0, todo: 1, backlog: 2, weekend: 3, done: 4 };

function getDeadlineGroup(task: PersonalTask): string {
  if (!task.deadline) return 'Sans echeance';
  const dl = new Date(task.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((dl.getTime() - today.getTime()) / 86400000);
  if (diff < 0 && task.status !== 'done') return 'En retard';
  if (diff === 0) return "Aujourd'hui";
  if (diff <= 7) return 'Cette semaine';
  if (diff <= 30) return 'Ce mois';
  return 'Plus tard';
}

const DEADLINE_GROUP_ORDER: Record<string, number> = {
  'En retard': 0, "Aujourd'hui": 1, 'Cette semaine': 2, 'Ce mois': 3, 'Plus tard': 4, 'Sans echeance': 5,
};

function groupTasks(tasks: PersonalTask[], groupBy: GroupBy): { label: string; tasks: PersonalTask[] }[] {
  const groups = new Map<string, PersonalTask[]>();

  tasks.forEach(task => {
    let keys: string[];
    switch (groupBy) {
      case 'status': {
        const s = task.status === 'backlog' ? 'todo' : task.status;
        keys = [STATUS_LABELS[s] || s];
        break;
      }
      case 'tag':
        keys = task.tags && task.tags.length > 0 ? task.tags : ['Sans tag'];
        break;
      case 'priority':
        keys = [PRIORITY_LABELS[task.priority] || task.priority];
        break;
      case 'deadline':
        keys = [getDeadlineGroup(task)];
        break;
      default:
        keys = ['Autre'];
    }
    keys.forEach(key => {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    });
  });

  const entries = Array.from(groups.entries()).map(([label, tasks]) => ({ label, tasks }));

  switch (groupBy) {
    case 'status':
      entries.sort((a, b) => {
        const orderMap: Record<string, number> = {};
        Object.entries(STATUS_LABELS).forEach(([k, v]) => { orderMap[v] = STATUS_ORDER[k] ?? 9; });
        return (orderMap[a.label] ?? 9) - (orderMap[b.label] ?? 9);
      });
      break;
    case 'priority':
      entries.sort((a, b) => {
        const orderMap: Record<string, number> = {};
        Object.entries(PRIORITY_LABELS).forEach(([k, v]) => { orderMap[v] = PRIORITY_ORDER[k] ?? 9; });
        return (orderMap[a.label] ?? 9) - (orderMap[b.label] ?? 9);
      });
      break;
    case 'deadline':
      entries.sort((a, b) => (DEADLINE_GROUP_ORDER[a.label] ?? 9) - (DEADLINE_GROUP_ORDER[b.label] ?? 9));
      break;
    case 'tag':
      entries.sort((a, b) => {
        if (a.label === 'Sans tag') return 1;
        if (b.label === 'Sans tag') return -1;
        return a.label.localeCompare(b.label, 'fr');
      });
      break;
  }

  return entries;
}

// ---------------------------------------------------------------------------

function TaskRow({ task, onClick, onToggle }: { task: PersonalTask; onClick: (t: PersonalTask) => void; onToggle: () => void }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';

  return (
    <div
      onClick={() => onClick(task)}
      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group border border-transparent ${
        isDone
          ? 'opacity-50 hover:opacity-80 hover:bg-[#1a1925]'
          : 'hover:bg-[#1f1e2e] hover:border-[#2d2b3d] hover:shadow-sm'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`mt-0.5 w-5 h-5 rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all ${
          isDone
            ? 'bg-green-500/20 border-green-500 text-green-400'
            : `border-muted-foreground/30 hover:border-muted-foreground/60 hover:scale-110`
        }`}
        aria-label={isDone ? 'Rouvrir' : 'Terminer'}
      >
        {isDone && <CheckCircle2 className="w-3 h-3" />}
      </button>

      {/* Content block */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
          <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </span>
        </div>
        {/* Description preview */}
        {task.description && !isDone && (
          <p className="text-xs text-muted-foreground/40 truncate pl-4">
            {task.description}
          </p>
        )}
      </div>

      {/* Tags (max 2) */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 mt-0.5">
        {task.tags?.slice(0, 2).map(tag => (
          <Badge key={tag} variant="outline" className={`text-[9px] px-1.5 py-0 border ${getTagColor(tag)}`}>
            {tag}
          </Badge>
        ))}
        {(task.tags?.length || 0) > 2 && (
          <span className="text-[9px] text-muted-foreground/40">+{task.tags!.length - 2}</span>
        )}
      </div>

      {/* Deadline */}
      {task.deadline ? (
        <div className={`flex items-center gap-1 text-[11px] shrink-0 mt-0.5 ${isOverdue ? 'text-red-400 font-semibold' : 'text-muted-foreground/40'}`}>
          {isOverdue && <AlertTriangle className="h-3 w-3" />}
          <Calendar className="h-3 w-3" />
          <span>{new Date(task.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground/20 shrink-0 mt-0.5">—</span>
      )}

      <ChevronRight className="h-3.5 w-3.5 mt-1 text-muted-foreground/15 group-hover:text-muted-foreground/40 shrink-0 transition-colors" />
    </div>
  );
}

// ---------------------------------------------------------------------------

function CollapsibleGroup({ label, count, children, defaultOpen = true }: {
  label: string; count: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors rounded-md hover:bg-surface-2/30"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        <span>{label}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-surface-2/40 text-muted-foreground/50 tabular-nums">
          {count}
        </Badge>
        <div className="flex-1 border-b border-border/10 ml-2" />
      </button>
      {open && <div className="space-y-0.5 mt-0.5">{children}</div>}
    </div>
  );
}

// ===========================================================================

export function TaskListView({ tasks, onClickTask, onToggleStatus }: TaskListViewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status');

  const groups = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy]);

  return (
    <div className="space-y-3">
      {/* Group by selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/50">Grouper par</span>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-surface-2 border-border/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GROUP_OPTIONS).map(([key, opt]) => (
              <SelectItem key={key} value={key}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Groups */}
      <div className="space-y-1 bg-surface-2/50 rounded-xl border border-border/15 p-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
            <Clock className="h-8 w-8 mb-2" />
            <span className="text-sm">Aucune tache trouvee</span>
          </div>
        ) : (
          groups.map(group => (
            <CollapsibleGroup
              key={group.label}
              label={group.label}
              count={group.tasks.length}
              defaultOpen={group.label !== 'Termine'}
            >
              {group.tasks.map(task => (
                <TaskRow key={task.id} task={task} onClick={onClickTask} onToggle={() => onToggleStatus(task.id, task.status !== 'done')} />
              ))}
            </CollapsibleGroup>
          ))
        )}
      </div>
    </div>
  );
}
