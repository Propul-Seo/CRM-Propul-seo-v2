import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CRMERPLead } from '../types';

export function useCRMERPLeadDetails(leadId: string | null) {
  const [lead, setLead] = useState<CRMERPLead | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('crmerp_leads')
      .select('*, assignee:users!assignee_id(id, name, email)')
      .eq('id', leadId)
      .single();
    if (!error && data) setLead(data);
    setLoading(false);
  }, [leadId]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  const updateLead = useCallback(async (updates: Partial<CRMERPLead>) => {
    if (!leadId) return;
    const { error } = await supabase.from('crmerp_leads').update(updates).eq('id', leadId);
    if (error) throw error;
    await fetchLead();
  }, [leadId, fetchLead]);

  return { lead, loading, refetch: fetchLead, updateLead };
}
