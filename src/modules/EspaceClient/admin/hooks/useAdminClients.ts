import { useCallback, useEffect, useState } from 'react';
import { v2 } from '@/lib/supabase';

export interface AdminClientHealth {
  project_id: string;
  project_name: string;
  client_company: string | null;
  portal_client_email: string | null;
  portal_activated_at: string | null;
  last_client_login_at: string | null;
  invoices_overdue: number;
  invoices_pending: number;
  signatures_pending: number;
  documents_count: number;
}

// Projet actif (table projects_v2 via le proxy v2)
interface ActiveProjectRow {
  id: string;
  name: string;
  client_company: string | null;
  client_first_name: string | null;
  portal_client_email: string | null;
  portal_activated_at: string | null;
}

// Métriques de santé portail (vue projects_portal_health_v2)
interface PortalHealthRow {
  project_id: string;
  invoices_overdue: number;
  invoices_pending: number;
  signatures_pending: number;
  documents_count: number;
  last_client_login_at: string | null;
}

interface UseAdminClientsResult {
  clients: AdminClientHealth[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAdminClients(): UseAdminClientsResult {
  const [clients, setClients] = useState<AdminClientHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    // 1) Liste de tous les projets actifs (un projet = un client), avec ou sans portail.
    const { data: projectsData, error: projectsErr } = await v2
      .from('projects')
      .select('id, name, client_company, client_first_name, portal_client_email, portal_activated_at')
      .is('archived_at', null)
      .order('name', { ascending: true });
    if (projectsErr) { setError(projectsErr.message); setClients([]); setLoading(false); return; }

    // 2) Métriques de santé portail (uniquement les projets ayant un portail).
    const { data: healthData, error: healthErr } = await v2
      .from('projects_portal_health')
      .select('*');
    if (healthErr) { setError(healthErr.message); setClients([]); setLoading(false); return; }

    // Le proxy v2 infère un SelectQueryError ; on repasse par `unknown` (pattern
    // établi pour les lectures v2) pour typer projects_v2 / projects_portal_health_v2.
    const projects = (projectsData ?? []) as unknown as ActiveProjectRow[];
    const health = (healthData ?? []) as unknown as PortalHealthRow[];
    const healthMap = new Map<string, PortalHealthRow>(health.map(h => [h.project_id, h]));

    const merged: AdminClientHealth[] = projects.map(p => {
      const h = healthMap.get(p.id);
      return {
        project_id: p.id,
        project_name: p.name,
        client_company: p.client_company,
        portal_client_email: p.portal_client_email,
        portal_activated_at: p.portal_activated_at,
        last_client_login_at: h?.last_client_login_at ?? null,
        invoices_overdue: h?.invoices_overdue ?? 0,
        invoices_pending: h?.invoices_pending ?? 0,
        signatures_pending: h?.signatures_pending ?? 0,
        documents_count: h?.documents_count ?? 0,
      };
    });

    setError(null);
    setClients(merged);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { clients, loading, error, refresh };
}

export function useAdminClientEmail(projectId: string | undefined): string | null {
  const { clients } = useAdminClients();
  if (!projectId) return null;
  return clients.find(c => c.project_id === projectId)?.portal_client_email ?? null;
}

export interface AdminProjectRow {
  id: string;
  name: string;
  portal_client_email: string | null;
  portal_previous_client_email: string | null;
  portal_activated_at: string | null;
  client_company: string | null;
}

export function useAdminProject(projectId: string | undefined): { project: AdminProjectRow | null; loading: boolean; refresh: () => Promise<void> } {
  const [project, setProject] = useState<AdminProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!projectId) { setProject(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await v2.from('projects')
      .select('id, name, portal_client_email, portal_previous_client_email, portal_activated_at, client_company')
      .eq('id', projectId).maybeSingle();
    if (error) { setProject(null); } else { setProject((data ?? null) as unknown as AdminProjectRow | null); }
    setLoading(false);
  }, [projectId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { project, loading, refresh };
}
