import { useState, useRef, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { getTagColor, PRIORITY_COLORS } from '../types';
import type { PersonalTask, PersonalTaskStatus } from '../../../types/personalTasks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ScratchPadViewProps {
  tasks: PersonalTask[];
  onClickTask: (task: PersonalTask) => void;
  onCreateTask: (title: string, status: PersonalTaskStatus) => void;
  onToggleStatus: (id: string, done: boolean) => void;
}

// ---------------------------------------------------------------------------
// Sections config
// ---------------------------------------------------------------------------
const SECTIONS: { id: PersonalTaskStatus; label: string; match: PersonalTaskStatus[] }[] = [
  { id: 'in_progress', label: 'En cours',  match: ['in_progress'] },
  { id: 'todo',        label: 'À faire',   match: ['todo', 'backlog'] },
  { id: 'weekend',     label: 'Week-end',  match: ['weekend'] },
  { id: 'done',        label: 'Terminé',   match: ['done'] },
];

// ---------------------------------------------------------------------------
// Hand-drawn checkbox SVG
// ---------------------------------------------------------------------------
function ScratchCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="shrink-0 w-5 h-5 flex items-center justify-center group/cb"
      aria-label={checked ? 'Marquer non terminé' : 'Marquer terminé'}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        {/* Imperfect hand-drawn circle */}
        <path
          d="M12 3.5c4.5-.2 8.2 3 8.4 7.5.3 4.8-3.4 8.8-8 9-4.8.2-8.6-3.2-8.9-7.8C3.2 7.5 6.8 3.7 12 3.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={checked ? 'text-green-400' : 'text-muted-foreground/50 group-hover/cb:text-muted-foreground'}
        />
        {/* Checkmark — scribbled style */}
        {checked && (
          <path
            d="M7.5 12.5l3 3.5 6.5-8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-400"
          />
        )}
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inline create input
// ---------------------------------------------------------------------------
function InlineCreate({ status, onCreateTask }: { status: PersonalTaskStatus; onCreateTask: (title: string, status: PersonalTaskStatus) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onCreateTask(trimmed, status);
    }
    setValue('');
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="h-[32px] flex items-center pl-[60px] cursor-text"
      >
        <span className="text-sm italic text-muted-foreground/30" style={{ fontFamily: "'Caveat', cursive" }}>
          Nouvelle tâche...
        </span>
      </div>
    );
  }

  return (
    <div className="h-[32px] flex items-center pl-[60px]">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') { setValue(''); setEditing(false); }
        }}
        onBlur={submit}
        className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/30 placeholder:italic"
        style={{ fontFamily: "'Caveat', cursive", fontSize: '17px' }}
        placeholder="Écrire ici..."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single task row on the notebook
// ---------------------------------------------------------------------------
function ScratchRow({ task, onClick, onToggle }: {
  task: PersonalTask;
  onClick: (t: PersonalTask) => void;
  onToggle: () => void;
}) {
  const isDone = task.status === 'done';
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isDone;

  return (
    <div
      className="h-[32px] flex items-center gap-2.5 pl-[56px] pr-3 cursor-pointer group transition-colors hover:bg-[hsl(var(--primary)/0.06)] rounded-sm"
      onClick={() => onClick(task)}
    >
      <ScratchCheckbox checked={isDone} onChange={onToggle} />

      {/* Priority dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`} />

      {/* Title */}
      <span
        className={`flex-1 truncate leading-none ${isDone ? 'line-through text-muted-foreground/40' : 'text-foreground'}`}
        style={{ fontFamily: "'Caveat', cursive", fontSize: '17px' }}
      >
        {task.title}
      </span>

      {/* Tags */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {task.tags?.slice(0, 2).map(tag => (
          <Badge
            key={tag}
            variant="outline"
            className={`text-[9px] px-1.5 py-0 border-dashed ${getTagColor(tag)}`}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Deadline */}
      {task.deadline && (
        <span
          className={`text-xs shrink-0 flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-muted-foreground/50'}`}
          style={{ fontFamily: "'Caveat', cursive", fontSize: '14px' }}
        >
          {isOverdue && <AlertTriangle className="h-3 w-3" />}
          {new Date(task.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </div>
  );
}

// ===========================================================================
// Main ScratchPad
// ===========================================================================
export function ScratchPadView({ tasks, onClickTask, onCreateTask, onToggleStatus }: ScratchPadViewProps) {
  const sections = useMemo(() => {
    return SECTIONS.map(sec => ({
      ...sec,
      tasks: tasks.filter(t => sec.match.includes(t.status)),
    }));
  }, [tasks]);

  return (
    <div className="flex justify-center py-4">
      {/* The notebook sheet */}
      <div
        className="scratch-sheet relative w-full max-w-[720px] rounded-md overflow-hidden"
        style={{
          background: 'var(--surface-2)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)',
          transform: 'rotate(-0.3deg)',
        }}
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />

        {/* Ruled lines background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 31px, hsl(var(--border) / 0.2) 31px, hsl(var(--border) / 0.2) 32px)',
          }}
        />

        {/* Left margin line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-[2]"
          style={{
            left: '48px',
            background: 'hsl(0 60% 45% / 0.15)',
          }}
        />

        {/* Content */}
        <div className="relative z-[3] py-6 px-4">
          {sections.map(section => (
            <div key={section.id} className="mb-4">
              {/* Section title — handwritten style */}
              <div className="flex items-center gap-2 pl-[52px] mb-1 h-[32px]">
                <span
                  className="text-muted-foreground/60 tracking-wide"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: '15px',
                    fontWeight: 600,
                    borderBottom: '2px solid hsl(var(--primary) / 0.3)',
                    paddingBottom: '1px',
                    lineHeight: 1,
                  }}
                >
                  — {section.label} ({section.tasks.length}) —
                </span>
              </div>

              {/* Task rows */}
              {section.tasks.map(task => (
                <ScratchRow
                  key={task.id}
                  task={task}
                  onClick={onClickTask}
                  onToggle={() => onToggleStatus(task.id, task.status !== 'done')}
                />
              ))}

              {/* Inline add */}
              <InlineCreate
                status={section.id === 'done' ? 'todo' : section.id}
                onCreateTask={onCreateTask}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
