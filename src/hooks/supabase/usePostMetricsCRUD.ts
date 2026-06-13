import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { PostMetricsRow, PostMetricsInsert, PostMetricsUpdate, CRUDResult } from '@/types/supabase-types';

export function usePostMetricsCRUD() {
  const [loading, setLoading] = useState(false);

  const upsertMetrics = async (data: PostMetricsInsert): Promise<CRUDResult<PostMetricsRow>> => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('post_metrics')
        .upsert(data, { onConflict: 'post_id' })
        .select()
        .single();

      if (error) throw error;
      toast.success('Métriques sauvegardées');
      return { success: true, data: result };
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde des métriques');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = async (postId: string, updates: PostMetricsUpdate): Promise<CRUDResult<PostMetricsRow>> => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('post_metrics')
        .update(updates)
        .eq('post_id', postId)
        .select()
        .single();

      if (error) throw error;
      toast.success('Métriques mises à jour');
      return { success: true, data: result };
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour des métriques');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteMetrics = async (postId: string): Promise<CRUDResult<null>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('post_metrics')
        .delete()
        .eq('post_id', postId);

      if (error) throw error;
      toast.success('Métriques supprimées');
      return { success: true, data: undefined };
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshKPIViews = async (): Promise<void> => {
    try {
      await supabase.rpc('refresh_kpi_views');
    } catch (error) {
      console.error('Failed to refresh KPI views:', error);
    }
  };

  return {
    loading,
    upsertMetrics,
    updateMetrics,
    deleteMetrics,
    refreshKPIViews,
  };
}
