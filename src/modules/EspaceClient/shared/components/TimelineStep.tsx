import { Check, Loader2, Lock, AlertCircle } from 'lucide-react';
import type { ProjectStepStatus } from '@/modules/EspaceClient/shared/types/portal.types';

interface TimelineStepProps {
  status: ProjectStepStatus;
  label: string;
  startedAt?: string;
  completedAt?: string;
  isLast?: boolean;
}

const NODE_STYLE: Record<ProjectStepStatus, { bg: string; fg: string; ring: string }> = {
  upcoming:    { bg: 'bg-[var(--ps-bg-subtle)]',     fg: 'text-[var(--ps-fg-muted)]', ring: 'ring-[var(--ps-border)]' },
  in_progress: { bg: 'ps-brand-gradient',            fg: 'text-white',                ring: 'ring-[var(--ps-primary-subtle)]' },
  completed:   { bg: 'bg-emerald-500',               fg: 'text-white',                ring: 'ring-emerald-100' },
  blocked:     { bg: 'bg-red-500',                   fg: 'text-white',                ring: 'ring-red-100' },
};

const ICON: Record<ProjectStepStatus, typeof Check> = {
  upcoming:    Lock,
  in_progress: Loader2,
  completed:   Check,
  blocked:     AlertCircle,
};

export function TimelineStep({ status, label, startedAt, completedAt, isLast = false }: TimelineStepProps) {
  const style = NODE_STYLE[status];
  const Icon = ICON[status];
  const spin = status === 'in_progress';

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[15px] top-8 h-[calc(100%-32px)] w-px bg-[var(--ps-border-soft)]"
        />
      )}
      <span
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ${style.bg} ${style.ring}`}
      >
        <Icon className={`h-4 w-4 ${style.fg} ${spin ? 'animate-spin' : ''}`} strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[13.5px] font-semibold tracking-tight text-[var(--ps-fg)]">
          {label}
        </p>
        {(startedAt || completedAt) && (
          <p className="mt-0.5 text-[12px] text-[var(--ps-fg-muted)]">
            {completedAt
              ? `Terminé le ${completedAt}`
              : startedAt
                ? `Démarré le ${startedAt}`
                : null}
          </p>
        )}
      </div>
    </li>
  );
}
