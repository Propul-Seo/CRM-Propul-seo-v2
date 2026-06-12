import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface HeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  phasePill?: string;
}

export function Hero({ eyebrow, title, subtitle, phasePill }: HeroProps) {
  return (
    <section className="ps-surface relative overflow-hidden p-7 md:p-9">
      <div
        aria-hidden
        className="ps-hero-glow pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
      />
      {eyebrow && (
        <p className="ps-eyebrow">{eyebrow}</p>
      )}
      <h1 className="ps-h1 pt-1.5 text-[var(--ps-fg)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
          {subtitle}
        </p>
      )}
      {phasePill && (
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-primary-subtle)] px-3 py-1 text-[11.5px] font-semibold text-[var(--ps-primary-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-primary)] animate-pulse" />
          {phasePill}
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
        </div>
      )}
    </section>
  );
}
