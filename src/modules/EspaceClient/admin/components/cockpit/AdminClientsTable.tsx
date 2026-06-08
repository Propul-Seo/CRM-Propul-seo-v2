import { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Badge, EmptyState } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';
import {
  deriveClientStatus, clientInitials, clientAvatarTone, formatLastActivity,
  type ClientStatusKey,
} from './clientStatus';

type FilterKey = 'all' | 'active' | 'overdue';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tous les statuts' },
  { key: 'active', label: 'Actif seulement' },
  { key: 'overdue', label: 'Impayés' },
];

function matchFilter(status: ClientStatusKey, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return status === 'active';
  if (filter === 'overdue') return status === 'overdue';
  return true;
}

interface Props {
  clients: AdminClientHealth[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (projectId: string) => void;
}

// Colonne gauche du cockpit : table dense des clients/portails.
// Colonnes : Client / Projet / Statut portail / Impayé (compteur) / Dernière activité.
export function AdminClientsTable({ clients, loading, error, selectedId, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return clients.filter(c => {
      const status = deriveClientStatus(c).key;
      if (!matchFilter(status, filter)) return false;
      if (!needle) return true;
      return (
        c.project_name.toLowerCase().includes(needle) ||
        (c.client_company ?? '').toLowerCase().includes(needle) ||
        (c.portal_client_email ?? '').toLowerCase().includes(needle)
      );
    });
  }, [clients, q, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar : recherche + filtres */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            aria-label="Rechercher un client"
            className="w-56 rounded-md border border-border bg-surface-3 py-1.5 pl-8 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
          />
        </div>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md border px-2.5 py-1.5 text-xs transition ${
              filter === f.key
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-surface-3 text-muted-foreground hover:text-foreground/80'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} client{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Corps */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <div className="px-4 py-6 text-sm text-muted-foreground">Chargement…</div>}
        {error && (
          <div className="m-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-4">
            <EmptyState icon={Users} title="Aucun client" body="Les projets actifs apparaîtront ici." />
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b border-border bg-surface-1 text-left">
                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Client</th>
                <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Projet</th>
                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Statut</th>
                <th className="hidden px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">Impayés</th>
                <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">Activité</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const status = deriveClientStatus(c);
                const selected = c.project_id === selectedId;
                return (
                  <tr
                    key={c.project_id}
                    onClick={() => onSelect(c.project_id)}
                    className={`cursor-pointer border-b border-border transition ${
                      selected ? 'bg-primary/10' : 'hover:bg-surface-2'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${clientAvatarTone(c.project_id)}`}
                        >
                          {clientInitials(c)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-foreground">
                            {c.client_company ?? c.project_name}
                          </div>
                          <div className="truncate text-[11.5px] text-muted-foreground">
                            {c.portal_client_email ?? '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <span className="line-clamp-1 text-[12.5px] text-foreground">{c.project_name}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums xl:table-cell">
                      {c.invoices_overdue > 0 ? (
                        <span className="text-[12.5px] font-semibold text-red-300">{c.invoices_overdue}</span>
                      ) : (
                        <span className="text-[12.5px] text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2.5 xl:table-cell">
                      <span className="text-[12px] text-muted-foreground">{formatLastActivity(c.last_client_login_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
