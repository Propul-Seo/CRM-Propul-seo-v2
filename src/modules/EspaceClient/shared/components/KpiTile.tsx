import type { LucideIcon } from 'lucide-react';

export type KpiTint = 'violet' | 'blue' | 'green' | 'orange' | 'red';

interface KpiTileProps {
  eyebrow: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  tint?: KpiTint;
}

// Tints en classes Tailwind littérales pour que le purge les garde.
const TINTS: Record<KpiTint, { bg: string; fg: string }> = {
  violet: { bg: 'bg-[var(--ps-primary-subtle)]', fg: 'text-[var(--ps-primary-text)]' },
  blue:   { bg: 'bg-[var(--ps-info-subtle)]',    fg: 'text-[var(--ps-info-text)]' },
  green:  { bg: 'bg-[var(--ps-success-subtle)]', fg: 'text-[var(--ps-success-text)]' },
  orange: { bg: 'bg-[var(--ps-warning-subtle)]', fg: 'text-[var(--ps-warning-text)]' },
  red:    { bg: 'bg-[var(--ps-danger-subtle)]',  fg: 'text-[var(--ps-danger-text)]' },
};

export function KpiTile({ eyebrow, value, delta, icon: Icon, tint = 'violet' }: KpiTileProps) {
  const t = TINTS[tint];
  return (
    <div className="ps-surface ps-surface-hover relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="ps-eyebrow ps-eyebrow-muted">{eyebrow}</p>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.bg} ${t.fg}`}>
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
        )}
      </div>
      <p className="ps-num mt-3 text-[26px] font-bold leading-none tracking-tight text-[var(--ps-fg)]">
        {value}
      </p>
      {delta && (
        <p className="mt-1.5 text-[12px] text-[var(--ps-fg-muted)]">{delta}</p>
      )}
    </div>
  );
}
