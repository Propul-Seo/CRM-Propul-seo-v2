import type { BadgeTone } from '@/modules/EspaceClient/shared/components';
import type { AdminClientHealth } from '../../hooks/useAdminClients';

export type ClientStatusKey = 'no_portal' | 'overdue' | 'signature' | 'pending' | 'active';

export interface DerivedClientStatus {
  key: ClientStatusKey;
  label: string;
  tone: BadgeTone;
}

// Statut synthétique d'un client, dérivé des compteurs de santé portail.
// Priorité : pas de portail → impayé → signature en attente → paiement en attente → actif.
export function deriveClientStatus(c: AdminClientHealth): DerivedClientStatus {
  if (!c.portal_activated_at) return { key: 'no_portal', label: 'Pas de portail', tone: 'gray' };
  if (c.invoices_overdue > 0) return { key: 'overdue', label: 'Impayé', tone: 'red' };
  if (c.signatures_pending > 0) return { key: 'signature', label: 'Signature en attente', tone: 'amber' };
  if (c.invoices_pending > 0) return { key: 'pending', label: 'Paiement en attente', tone: 'blue' };
  return { key: 'active', label: 'Actif', tone: 'green' };
}

// Initiales pour l'avatar carré (société sinon nom de projet).
export function clientInitials(c: AdminClientHealth): string {
  const source = (c.client_company ?? c.project_name ?? '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Tonalité d'avatar stable par projet (déterministe, pas de hasard de rendu).
const AVATAR_TONES = [
  'bg-primary/15 text-primary',
  'bg-blue-500/15 text-blue-300',
  'bg-emerald-500/15 text-emerald-300',
  'bg-amber-500/15 text-amber-300',
  'bg-rose-500/15 text-rose-300',
] as const;

export function clientAvatarTone(projectId: string): string {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

// Dernière activité affichée : connexion client la plus récente, en relatif court.
export function formatLastActivity(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an(s)`;
}
