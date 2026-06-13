import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useCRMERPLeadAssign(leadId: string | null, onUpdate: () => Promise<void>) {
  const assign = useCallback(async (userId: string | null) => {
    if (!leadId) return;
    const { error } = await supabase
      .from('crmerp_leads')
      .update({ assignee_id: userId || null })
      .eq('id', leadId);
    if (error) throw error;
    await onUpdate();
  }, [leadId, onUpdate]);

  return { assign };
}
