import type { ReactNode } from 'react';

interface StepShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

// Coque commune aux 7 étapes : titre + sous-titre + contenu en stack vertical.
export function StepShell({ title, subtitle, children }: StepShellProps) {
  return (
    <div className="ps-fade-in space-y-6">
      <header>
        <h1 className="ps-gradient-text text-[24px] font-bold leading-tight tracking-tight md:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--ps-fg-secondary)]">{subtitle}</p>
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

interface FieldGroupProps {
  label: ReactNode;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FieldGroup({ label, hint, required, error, children }: FieldGroupProps) {
  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-semibold text-[var(--ps-fg)]">
        {label}
        {required && <span className="ml-1 text-[var(--ps-primary)]">*</span>}
      </label>
      {hint && <p className="text-[11.5px] text-[var(--ps-fg-muted)]">{hint}</p>}
      {children}
      {error && <p className="text-[11.5px] text-red-600">{error}</p>}
    </div>
  );
}
