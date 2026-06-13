import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: ReactNode;
  hint?: string;
  /** Icône Lucide préférée ; prioritaire sur `emoji` si les deux sont fournis. */
  icon?: LucideIcon;
  /** @deprecated Préférer `icon` (Lucide). Conservé pour rétrocompat. */
  emoji?: string;
  disabled?: boolean;
}

// DA Aurora : card blanche par défaut, accent violet de marque au checked,
// ring violet pour bien marquer la sélection.
export function RadioCard({ name, value, checked, onChange, label, hint, icon: Icon, emoji, disabled }: RadioCardProps) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={`ps-choice-card relative flex min-h-[58px] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-200 ease-out ${
        checked
          ? 'ps-choice-card-active border-violet-400 bg-white shadow-[0_10px_28px_-18px_rgba(88,28,135,0.48)] ring-1 ring-violet-200'
          : 'border-stone-200 bg-white shadow-sm hover:border-violet-300 hover:shadow-[0_10px_24px_-22px_rgba(88,28,135,0.45)]'
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
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          checked ? 'border-[var(--ps-primary)] bg-[var(--ps-primary)] text-white' : 'border-stone-200 bg-white'
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold leading-5 text-stone-950">
          {Icon ? (
            <Icon className="h-4 w-4 shrink-0 text-[var(--ps-primary)]" aria-hidden />
          ) : emoji ? (
            <span className="text-base leading-none">{emoji}</span>
          ) : null}
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-[12px] leading-4 text-stone-500">{hint}</span>
        )}
      </span>
    </label>
  );
}
