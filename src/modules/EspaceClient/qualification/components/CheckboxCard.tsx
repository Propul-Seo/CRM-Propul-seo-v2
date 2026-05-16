import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface CheckboxCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: string;
}

export function CheckboxCard({ name, value, checked, onChange, label, hint }: CheckboxCardProps) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 [transition-timing-function:var(--ps-ease)] ${
        checked
          ? 'border-[var(--ps-primary)] bg-[var(--ps-primary-subtle)] shadow-[inset_0_0_0_1px_var(--ps-primary)]'
          : 'border-[var(--ps-border)] bg-white hover:border-[var(--ps-primary)]/40 hover:bg-[var(--ps-bg-subtle)]'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked
            ? 'border-[var(--ps-primary)] bg-[var(--ps-primary)] text-white'
            : 'border-[var(--ps-border-strong)] bg-white'
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[13.5px] font-semibold text-[var(--ps-fg)]">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-[var(--ps-fg-muted)]">{hint}</span>}
      </span>
    </label>
  );
}
