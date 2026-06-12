import { useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { AdminEmptyState, AdminFilterPills } from '@/modules/EspaceClient/admin/components/kit';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import { CompactClientRow } from './CompactClientRow';
import {
  sortClients, groupByTier, TIER_LABELS, COCKPIT_FILTERS, matchCockpitFilter,
  matchSearch, countByFilter, type CockpitFilter,
} from './clientSort';

interface Props {
  clients: AdminClientHealth[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (projectId: string) => void;
}

// Squelette de ligne pendant le chargement (même gabarit que CompactClientRow).
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-3.5 py-2.5">
      <div className="ps-skeleton h-9 w-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="ps-skeleton h-3 w-2/5" />
        <div className="ps-skeleton h-2.5 w-3/5" />
      </div>
    </div>
  );
}

// Colonne gauche du cockpit : recherche + filtres (avec compteurs) puis liste
// compacte GROUPÉE par palier (Portails actifs / Projets en cours / Autres).
export function AdminClientsList({ clients, loading, error, selectedId, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<CockpitFilter>('all');

  const counts = useMemo(() => countByFilter(clients), [clients]);
  const groups = useMemo(
    () => groupByTier(sortClients(clients.filter(c => matchCockpitFilter(c, filter) && matchSearch(c, q)))),
    [clients, filter, q],
  );
  const total = useMemo(() => groups.reduce((n, g) => n + g.clients.length, 0), [groups]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-3 py-2.5">
        <div className="relative mb-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            aria-label="Rechercher un client"
            className="w-full rounded-md border border-border bg-surface-3 py-1.5 pl-8 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
          />
        </div>
        <AdminFilterPills
          filters={COCKPIT_FILTERS.map(f => ({ label: f.label, value: f.key, count: counts[f.key] }))}
          current={filter}
          onChange={setFilter}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div aria-busy="true" aria-label="Chargement des clients">
            <div className="px-3.5 pb-1.5 pt-3">
              <div className="ps-skeleton h-2.5 w-24" />
            </div>
            {Array.from({ length: 6 }, (_, i) => <RowSkeleton key={i} />)}
          </div>
        )}
        {error && (
          <div className="m-3 rounded-lg bg-[var(--ps-danger-subtle)] px-4 py-3 text-sm text-[var(--ps-danger-text)]">
            {error}
          </div>
        )}
        {!loading && !error && total === 0 && (
          <AdminEmptyState
            icon={SearchX}
            title="Aucun client"
            body="Aucun résultat pour cette recherche ou ce filtre."
          />
        )}
        {!loading && !error && groups.map(g => (
          <div key={g.tier}>
            <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-border bg-surface-1 px-3.5 py-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {TIER_LABELS[g.tier]}
              </span>
              <span className="rounded-full bg-surface-3 px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
                {g.clients.length}
              </span>
            </div>
            {g.clients.map(c => (
              <CompactClientRow
                key={c.project_id}
                client={c}
                selected={c.project_id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
