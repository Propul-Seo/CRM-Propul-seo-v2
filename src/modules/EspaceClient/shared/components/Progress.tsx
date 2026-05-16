interface ProgressProps {
  value: number;
  label?: string;
  valueLabel?: string;
  success?: boolean;
}

export function Progress({ value, label, valueLabel, success = false }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || valueLabel != null) && (
        <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
          {label && (
            <span className="font-semibold text-[var(--ps-fg)]">{label}</span>
          )}
          {valueLabel != null && (
            <span className="ps-num font-semibold text-[var(--ps-primary-text)]">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={label}
        className="h-2 overflow-hidden rounded-full bg-[var(--ps-bg-subtle)]"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 [transition-timing-function:var(--ps-ease-out)] ${
            success
              ? 'bg-[var(--ps-success)]'
              : 'ps-brand-gradient'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
