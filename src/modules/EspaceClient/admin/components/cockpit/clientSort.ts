import { statusToColumn } from '@/modules/ProjectsV3/utils/statusMapping';
import type { ProjectStatusV2 } from '@/types/project-v2';
import type { AdminClientHealth } from '../../hooks/useAdminClients';

// Tri demandé : portails actifs d'abord, puis projets en cours, puis le reste
// (projets sans portail non démarrés / terminés en bas).
export type ClientTier = 'portal' | 'inprogress' | 'other';

export const TIER_LABELS: Record<ClientTier, string> = {
  portal: 'Portails actifs',
  inprogress: 'Projets en cours',
  other: 'Autres projets',
};

export const TIER_ORDER: ClientTier[] = ['portal', 'inprogress', 'other'];

export function clientTier(c: AdminClientHealth): ClientTier {
  if (c.portal_activated_at) return 'portal';
  if (c.status && statusToColumn(c.status as ProjectStatusV2) === 'actifs') return 'inprogress';
  return 'other';
}

const RANK: Record<ClientTier, number> = { portal: 0, inprogress: 1, other: 2 };

// Urgence au sein d'un même palier : impayés puis signatures en attente.
function urgency(c: AdminClientHealth): number {
  return c.invoices_overdue * 2 + c.signatures_pending;
}

function clientLabel(c: AdminClientHealth): string {
  return c.client_company ?? c.project_name ?? '';
}

export function sortClients(list: AdminClientHealth[]): AdminClientHealth[] {
  return [...list].sort((a, b) => {
    const tier = RANK[clientTier(a)] - RANK[clientTier(b)];
    if (tier !== 0) return tier;
    const u = urgency(b) - urgency(a);
    if (u !== 0) return u;
    return clientLabel(a).localeCompare(clientLabel(b), 'fr');
  });
}

// ── Filtres (avec compteurs) ──────────────────────────────────────
export type CockpitFilter = 'all' | 'portal' | 'noportal';

export const COCKPIT_FILTERS: { key: CockpitFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'portal', label: 'Portail actif' },
  { key: 'noportal', label: 'Sans portail' },
];

export function matchCockpitFilter(c: AdminClientHealth, f: CockpitFilter): boolean {
  if (f === 'portal') return !!c.portal_activated_at;
  if (f === 'noportal') return !c.portal_activated_at;
  return true;
}

export function countByFilter(clients: AdminClientHealth[]): Record<CockpitFilter, number> {
  return {
    all: clients.length,
    portal: clients.filter(c => c.portal_activated_at).length,
    noportal: clients.filter(c => !c.portal_activated_at).length,
  };
}

export function matchSearch(c: AdminClientHealth, needle: string): boolean {
  if (!needle) return true;
  const n = needle.toLowerCase();
  return (
    c.project_name.toLowerCase().includes(n) ||
    (c.client_company ?? '').toLowerCase().includes(n) ||
    (c.portal_client_email ?? '').toLowerCase().includes(n)
  );
}

// Regroupe (déjà filtrés/triés) par palier pour la variante « liste groupée ».
export function groupByTier(clients: AdminClientHealth[]): { tier: ClientTier; clients: AdminClientHealth[] }[] {
  return TIER_ORDER
    .map(tier => ({ tier, clients: clients.filter(c => clientTier(c) === tier) }))
    .filter(g => g.clients.length > 0);
}
