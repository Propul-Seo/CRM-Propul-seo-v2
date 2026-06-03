import { useCallback, useEffect, useState } from 'react';
import { v2 } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalProjectStep } from '@/modules/EspaceClient/client/hooks/usePortalData';

export interface ProjectStepInput {
  label: string;
  status: string;                 // 'upcoming' | 'in_progress' | 'completed' | 'blocked'
  description?: string | null;
  dateStart?: string | null;      // 'YYYY-MM-DD'
  datePlannedEnd?: string | null;
  dateActualEnd?: string | null;
  visibleToClient: boolean;
}

interface UseAdminProjectStepsResult {
  steps: PortalProjectStep[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createStep: (input: ProjectStepInput) => Promise<{ error: string | null }>;
  updateStep: (stepId: string, input: Partial<ProjectStepInput>) => Promise<{ error: string | null }>;
  deleteStep: (stepId: string) => Promise<{ error: string | null }>;
  reorder: (orderedIds: string[]) => Promise<{ error: string | null }>;
}

export function useAdminProjectSteps(projectId: string): UseAdminProjectStepsResult {
  const [steps, setSteps] = useState<PortalProjectStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from('propulspace_project_steps')
      .select('*').eq('project_id', projectId).order('step_order', { ascending: true });
    if (err) { setError(err.message); setSteps([]); }
    else { setError(null); setSteps((data ?? []) as unknown as PortalProjectStep[]); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createStep = useCallback<UseAdminProjectStepsResult['createStep']>(async (input) => {
    const { error: err } = await adminRpc('admin_create_project_step', {
      p_project_id: projectId,
      p_label: input.label,
      p_status: input.status,
      p_description: input.description ?? null,
      p_date_start: input.dateStart ?? null,
      p_date_planned_end: input.datePlannedEnd ?? null,
      p_date_actual_end: input.dateActualEnd ?? null,
      p_visible_to_client: input.visibleToClient,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  const updateStep = useCallback<UseAdminProjectStepsResult['updateStep']>(async (stepId, input) => {
    const { error: err } = await adminRpc('admin_update_project_step', {
      p_step_id: stepId,
      p_label: input.label ?? null,
      p_status: input.status ?? null,
      p_description: input.description ?? null,
      p_date_start: input.dateStart ?? null,
      p_date_planned_end: input.datePlannedEnd ?? null,
      p_date_actual_end: input.dateActualEnd ?? null,
      // undefined → null (COALESCE garde la valeur existante) ; false reste false (ne pas utiliser ||)
      p_visible_to_client: input.visibleToClient ?? null,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const deleteStep = useCallback<UseAdminProjectStepsResult['deleteStep']>(async (stepId) => {
    const { error: err } = await adminRpc('admin_delete_project_step', { p_step_id: stepId });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const reorder = useCallback<UseAdminProjectStepsResult['reorder']>(async (orderedIds) => {
    const { error: err } = await adminRpc('admin_reorder_project_steps', { p_project_id: projectId, p_ordered_ids: orderedIds });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  return { steps, loading, error, refresh, createStep, updateStep, deleteStep, reorder };
}
