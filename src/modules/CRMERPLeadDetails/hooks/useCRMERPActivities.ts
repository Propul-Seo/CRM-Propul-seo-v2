import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CRMERPActivity, ActivityType } from '../types';

export function useCRMERPActivities(leadId: string | null) {
  const [activities, setActivities] = useState<CRMERPActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('crmerp_activities')
      .select('*, creator:users!created_by(id, name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (!error) setActivities(data ?? []);
    setLoading(false);
  }, [leadId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // Realtime
  useEffect(() => {
    if (!leadId) return;
    const channel = supabase
      .channel(`crmerp-activities-${leadId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'crmerp_activities',
        filter: `lead_id=eq.${leadId}`,
      }, () => { fetchActivities(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [leadId, fetchActivities]);

  const addActivity = useCallback(async (type: ActivityType, content: string, userId: string | null) => {
    if (!leadId) return;
    const { error } = await supabase.from('crmerp_activities').insert({
      lead_id: leadId, type, content, created_by: userId,
    });
    if (error) throw error;
    // Logguer une activité = un contact a eu lieu maintenant → on cale
    // last_activity_at sur le lead pour que le tri du board CRM le fasse
    // redescendre (best-effort, sans bloquer si l'update échoue).
    const { error: bumpErr } = await supabase
      .from('crmerp_leads')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', leadId);
    if (bumpErr) console.warn('[useCRMERPActivities] bump last_activity_at échoué:', bumpErr);
    await fetchActivities();
  }, [leadId, fetchActivities]);

  const updateActivity = useCallback(async (id: string, updates: { type?: ActivityType; content?: string }) => {
    const { error } = await supabase.from('crmerp_activities').update(updates).eq('id', id);
    if (error) throw error;
    await fetchActivities();
  }, [fetchActivities]);

  const deleteActivity = useCallback(async (id: string) => {
    const { error } = await supabase.from('crmerp_activities').delete().eq('id', id);
    if (error) throw error;
    await fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, addActivity, updateActivity, deleteActivity, refetch: fetchActivities };
}
