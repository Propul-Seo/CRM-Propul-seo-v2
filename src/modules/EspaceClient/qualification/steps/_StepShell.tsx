import type { ReactNode } from 'react';

interface StepShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

// Coque commune aux 7 étapes — DA Sky Aurora (alignée WelcomeWizard palier 9/10).
// Titre en gradient sky→violet→pink, sous-titre stone-600 sur fond clair.
export function StepShell({ title, subtitle, children }: StepShellProps) {
  return (
    <div className="ps-fade-in space-y-6">
      <header className="max-w-2xl">
        <h1 className="bg-gradient-to-r from-sky-600 via-violet-600 to-pink-500 bg-clip-text text-[25px] font-bold leading-tight text-transparent md:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-6 text-stone-600">{subtitle}</p>
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
    <div className="space-y-2.5">
      <label className="block text-[13.5px] font-semibold text-stone-950">
        {label}
        {required && <span className="ml-1 text-violet-600">*</span>}
      </label>
      {hint && <p className="max-w-2xl text-[12px] leading-5 text-stone-500">{hint}</p>}
      {children}
      {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">{error}</p>}
    </div>
  );
}
