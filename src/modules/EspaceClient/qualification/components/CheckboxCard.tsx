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
      className={`ps-choice-card relative flex min-h-[58px] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-200 ease-out ${
        checked
          ? 'ps-choice-card-active border-violet-400 bg-white shadow-[0_10px_28px_-18px_rgba(88,28,135,0.48)] ring-1 ring-violet-200'
          : 'border-stone-200 bg-white shadow-sm hover:border-violet-300 hover:shadow-[0_10px_24px_-22px_rgba(88,28,135,0.45)]'
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
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked
            ? 'border-violet-600 bg-gradient-to-br from-sky-500 to-violet-600 text-white'
            : 'border-stone-200 bg-white'
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[13.5px] font-semibold leading-5 text-stone-950">{label}</span>
        {hint && <span className="mt-1 block text-[12px] leading-4 text-stone-500">{hint}</span>}
      </span>
    </label>
  );
}
