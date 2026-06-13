import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from './Badge';

interface ActivityRowProps {
  icon: LucideIcon;
  tint?: BadgeTone;
  title: string;
  meta?: string;
  onClick?: () => void;
  href?: string;
}

const TINTS: Record<BadgeTone, string> = {
  violet: 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]',
  green:  'bg-[var(--ps-success-subtle)] text-[var(--ps-success-text)]',
  amber:  'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  red:    'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
  blue:   'bg-[var(--ps-info-subtle)] text-[var(--ps-info-text)]',
  gray:   'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]',
};

export function ActivityRow({
  icon: Icon,
  tint = 'violet',
  title,
  meta,
  onClick,
  href,
}: ActivityRowProps) {
  const body = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TINTS[tint]}`}>
        <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium tracking-tight text-[var(--ps-fg)]">
          {title}
        </p>
        {meta && (
          <p className="text-[12px] text-[var(--ps-fg-muted)]">{meta}</p>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-[var(--ps-fg-muted)]" />
    </>
  );

  const baseClass =
    'flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors duration-200 [transition-timing-function:var(--ps-ease)] hover:bg-[var(--ps-bg-subtle)]';

  if (href) {
    return (
      <a href={href} className={baseClass}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {body}
      </button>
    );
  }
  return <div className={baseClass}>{body}</div>;
}
