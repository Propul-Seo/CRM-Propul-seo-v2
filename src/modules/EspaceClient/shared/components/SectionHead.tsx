import type { ReactNode } from 'react';

interface SectionHeadProps {
  title: string;
  action?: ReactNode;
}

export function SectionHead({ title, action }: SectionHeadProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-6 py-4">
      <h2 className="ps-h3 tracking-tight">{title}</h2>
      {action}
    </header>
  );
}
