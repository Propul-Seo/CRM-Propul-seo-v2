import type { ReactNode } from 'react';

interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: ReactNode;
  hint?: string;
  emoji?: string;
  disabled?: boolean;
}

export function RadioCard({ name, value, checked, onChange, label, hint, emoji, disabled }: RadioCardProps) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 [transition-timing-function:var(--ps-ease)] ${
        checked
          ? 'border-[var(--ps-primary)] bg-[var(--ps-primary-subtle)] shadow-[inset_0_0_0_1px_var(--ps-primary)]'
          : 'border-[var(--ps-border)] bg-white hover:border-[var(--ps-primary)]/40 hover:bg-[var(--ps-bg-subtle)]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked ? 'border-[var(--ps-primary)]' : 'border-[var(--ps-border-strong)]'
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-[var(--ps-primary)]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--ps-fg)]">
          {emoji && <span className="text-base leading-none">{emoji}</span>}
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[12px] text-[var(--ps-fg-muted)]">{hint}</span>
        )}
      </span>
    </label>
  );
}
