import { useCallback, useEffect, useState } from 'react';
import { v2 } from '@/lib/supabase';

export interface AccountingProject {
  id: string;
  name: string;
  budget: number | null;
}

// Liste légère des projets (non archivés) pour le sélecteur et le suivi de budget.
// Passe par le proxy `v2` → table réelle public.projects_v2.
export function useAccountingProjects() {
  const [projects, setProjects] = useState<AccountingProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await v2
      .from('projects')
      .select('id, name, budget')
      .eq('is_archived', false)
      .order('name', { ascending: true });
    if (!error && data) setProjects(data as AccountingProject[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}
