import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
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
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            aria-label="Rechercher un client"
            className="w-full rounded-md border border-border bg-surface-3 py-1.5 pl-8 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COCKPIT_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md border px-2.5 py-1 text-xs transition ${
                filter === f.key
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-surface-3 text-muted-foreground hover:text-foreground/80'
              }`}
            >
              {f.label} <span className="opacity-60">· {counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <div className="px-4 py-6 text-sm text-muted-foreground">Chargement…</div>}
        {error && <div className="m-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {!loading && !error && total === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">Aucun client pour ce filtre.</p>
        )}
        {!loading && !error && groups.map(g => (
          <div key={g.tier}>
            <div className="sticky top-0 z-[1] flex items-center justify-between bg-surface-1 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {TIER_LABELS[g.tier]}
              <span className="opacity-60">{g.clients.length}</span>
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
