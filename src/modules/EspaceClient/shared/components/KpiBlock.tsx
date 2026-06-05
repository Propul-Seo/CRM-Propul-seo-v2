import type { ReactNode } from 'react';

export interface KpiBlockItem {
  eyebrow: string;
  value: ReactNode;
  delta?: ReactNode;
}

interface KpiBlockProps {
  items: KpiBlockItem[];
}

// Bloc KPI unifié : une seule surface, colonnes séparées par des filets fins
// (remplace les cards KPI flottantes). Flex + divide-x → supporte 2 à 4 KPI
// sans hardcoder le nombre de colonnes.
export function KpiBlock({ items }: KpiBlockProps) {
  return (
    <div className="ps-surface flex divide-x divide-[var(--ps-border-soft)] overflow-hidden">
      {items.map((it, i) => (
        <div key={i} className="min-w-0 flex-1 px-5 py-4">
          <p className="ps-eyebrow ps-eyebrow-muted">{it.eyebrow}</p>
          <p className="mt-2 truncate text-[var(--ps-fg)]">
            <span className="ps-metric">{it.value}</span>
          </p>
          {it.delta && <p className="mt-1 text-[12px] text-[var(--ps-fg-muted)]">{it.delta}</p>}
        </div>
      ))}
    </div>
  );
}
