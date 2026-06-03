import { useCallback, useEffect, useState } from 'react';
import { v2 } from '@/lib/supabase';

export interface AdminClientHealth {
  project_id: string;
  project_name: string;
  portal_client_email: string | null;
  portal_activated_at: string | null;
  last_client_login_at: string | null;
  invoices_overdue: number;
  invoices_pending: number;
  signatures_pending: number;
  documents_count: number;
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
    const { data, error: err } = await v2
      .from('projects_portal_health')
      .select('*')
      .order('portal_activated_at', { ascending: false, nullsFirst: false });
    if (err) { setError(err.message); setClients([]); }
    // Le proxy v2 infère un SelectQueryError ; on repasse par `unknown` (pattern
    // établi pour les vues lues via v2) pour typer la vue projects_portal_health_v2.
    else { setError(null); setClients((data ?? []) as unknown as AdminClientHealth[]); }
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
