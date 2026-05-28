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

// DA Sky Aurora : identique RadioCard pour cohérence visuelle.
export function CheckboxCard({ name, value, checked, onChange, label, hint }: CheckboxCardProps) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ease-out ${
        checked
          ? 'border-violet-400 bg-gradient-to-br from-sky-50 via-violet-50 to-pink-50 shadow-[0_4px_16px_-4px_rgba(139,92,246,0.25)] ring-1 ring-violet-300'
          : 'border-stone-200 bg-white hover:border-violet-300 hover:bg-stone-50'
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
            ? 'border-violet-600 bg-gradient-to-br from-sky-500 to-violet-600 text-white'
            : 'border-stone-300 bg-white'
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[13.5px] font-semibold text-stone-900">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-stone-500">{hint}</span>}
      </span>
    </label>
  );
}
