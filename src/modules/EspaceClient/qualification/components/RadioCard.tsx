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

// DA Sky Aurora : card blanche par défaut, gradient sky→violet→pink soft
// au checked, ring violet pour bien marquer la sélection.
export function RadioCard({ name, value, checked, onChange, label, hint, emoji, disabled }: RadioCardProps) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ease-out ${
        checked
          ? 'border-violet-400 bg-gradient-to-br from-sky-50 via-violet-50 to-pink-50 shadow-[0_4px_16px_-4px_rgba(139,92,246,0.25)] ring-1 ring-violet-300'
          : 'border-stone-200 bg-white hover:border-violet-300 hover:bg-stone-50'
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
          checked ? 'border-violet-600' : 'border-stone-300'
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-gradient-to-br from-sky-500 to-violet-600" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-stone-900">
          {emoji && <span className="text-base leading-none">{emoji}</span>}
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[12px] text-stone-500">{hint}</span>
        )}
      </span>
    </label>
  );
}
