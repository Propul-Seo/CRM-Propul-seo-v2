interface FilterDef<T> {
  label: string;
  value: T;
  count?: number;
}

interface Props<T extends string | null> {
  filters: FilterDef<T>[];
  current: T;
  onChange: (value: T) => void;
}

// Filtres horizontaux en pilules (Documents, Activité…). Compteur optionnel.
export function AdminFilterPills<T extends string | null>({ filters, current, onChange }: Props<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map(f => (
        <button
          key={f.label}
          type="button"
          onClick={() => onChange(f.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            current === f.value
              ? 'bg-primary text-white'
              : 'bg-surface-2 text-muted-foreground hover:text-foreground'
          }`}
        >
          {f.label}
          {f.count != null && <span className="opacity-60"> · {f.count}</span>}
        </button>
      ))}
    </div>
  );
}
