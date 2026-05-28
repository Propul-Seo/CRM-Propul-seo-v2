import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="ps-surface p-7 text-center">
      <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-full bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-muted)]">
        <Icon className="h-6 w-6" strokeWidth={1.6} />
      </div>
      <h3 className="ps-h3">{title}</h3>
      {body && (
        <p className="mx-auto mt-1 max-w-[280px] text-[13px] leading-relaxed text-[var(--ps-fg-secondary)]">
          {body}
        </p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
