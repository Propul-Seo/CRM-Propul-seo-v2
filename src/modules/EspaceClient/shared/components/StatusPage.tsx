import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type StatusTone = 'violet' | 'green' | 'orange' | 'red' | 'gray';

interface StatusPageProps {
  icon: LucideIcon;
  tone?: StatusTone;
  title: ReactNode;
  subtitle?: ReactNode;
  details?: ReactNode;
  primaryCta?: ReactNode;
  secondaryCta?: ReactNode;
  footnote?: ReactNode;
}

const ICON_BUBBLE: Record<StatusTone, string> = {
  violet: 'ps-brand-gradient text-white shadow-[var(--ps-shadow-brand)]',
  green:  'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[var(--ps-shadow-success)]',
  orange: 'bg-[var(--ps-warning-subtle)] text-[var(--ps-warning-text)]',
  red:    'bg-[var(--ps-danger-subtle)] text-[var(--ps-danger-text)]',
  gray:   'bg-[var(--ps-bg-subtle)] text-[var(--ps-fg-secondary)]',
};

export function StatusPage({
  icon: Icon,
  tone = 'violet',
  title,
  subtitle,
  details,
  primaryCta,
  secondaryCta,
  footnote,
}: StatusPageProps) {
  const strokeWidth = tone === 'violet' || tone === 'green' ? 2.4 : 2.2;
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center px-6 py-16">
      <div className="ps-surface relative w-full max-w-[480px] overflow-hidden p-10 text-center">
        <div
          aria-hidden
          className="ps-hero-glow pointer-events-none absolute -top-44 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        />
        <div className="relative">
          <div className={`mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full ${ICON_BUBBLE[tone]}`}>
            <Icon className="h-[30px] w-[30px]" strokeWidth={strokeWidth} />
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ps-fg)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-3.5 max-w-[380px] text-[14.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
              {subtitle}
            </p>
          )}
          {details && (
            <div className="mt-6 rounded-xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] p-4 text-left text-[13px] text-[var(--ps-fg-secondary)]">
              {details}
            </div>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="mt-6 flex flex-col gap-2">
              {primaryCta}
              {secondaryCta}
            </div>
          )}
          {footnote && (
            <p className="mt-5 text-[12px] text-[var(--ps-fg-muted)]">{footnote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
