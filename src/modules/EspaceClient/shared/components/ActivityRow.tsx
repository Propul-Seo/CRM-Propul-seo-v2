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
  green:  'bg-emerald-50 text-emerald-700',
  amber:  'bg-amber-50 text-amber-700',
  red:    'bg-red-50 text-red-700',
  blue:   'bg-blue-50 text-blue-700',
  gray:   'bg-zinc-100 text-zinc-700',
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
