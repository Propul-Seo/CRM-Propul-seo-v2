import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export interface RevenueAllocation {
  id: string;
  entry_id: string;
  revenue_category: 'site_internet' | 'erp' | 'communication';
  revenue_sous_categorie?: 'chatbot' | 'cm' | 'newsletter' | 'autre' | null;
  amount: number;
  created_at: string;
}

export function useRevenueAllocations(entryId: string | null) {
  const [allocations, setAllocations] = useState<RevenueAllocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllocations = useCallback(async () => {
    if (!entryId) {
      setAllocations([]);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('revenue_allocations')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAllocations(data || []);
    } catch (err) {
      console.error('Error fetching allocations:', err);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const addAllocation = async (alloc: {
    revenue_category: string;
    revenue_sous_categorie?: string | null;
    amount: number;
  }) => {
    if (!entryId) return { success: false };
    try {
      const { error } = await supabase
        .from('revenue_allocations')
        .insert({
          entry_id: entryId,
          revenue_category: alloc.revenue_category,
          revenue_sous_categorie: alloc.revenue_sous_categorie || null,
          amount: alloc.amount,
        });

      if (error) throw error;
      await fetchAllocations();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
      return { success: false };
    }
  };

  const updateAllocation = async (id: string, updates: Partial<RevenueAllocation>) => {
    try {
      const { error } = await supabase
        .from('revenue_allocations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchAllocations();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
      return { success: false };
    }
  };

  const deleteAllocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('revenue_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAllocations();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
      return { success: false };
    }
  };

  const replaceAllocations = async (newAllocations: Array<{
    revenue_category: string;
    revenue_sous_categorie?: string | null;
    amount: number;
  }>) => {
    if (!entryId) return { success: false };
    try {
      // Delete all existing allocations for this entry
      const { error: delError } = await supabase
        .from('revenue_allocations')
        .delete()
        .eq('entry_id', entryId);

      if (delError) throw delError;

      // Insert new ones
      if (newAllocations.length > 0) {
        const rows = newAllocations.map((a) => ({
          entry_id: entryId,
          revenue_category: a.revenue_category,
          revenue_sous_categorie: a.revenue_sous_categorie || null,
          amount: a.amount,
        }));

        const { error: insError } = await supabase
          .from('revenue_allocations')
          .insert(rows);

        if (insError) throw insError;
      }

      await fetchAllocations();
      toast.success('Répartition mise à jour');
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
      return { success: false };
    }
  };

  return {
    allocations,
    loading,
    addAllocation,
    updateAllocation,
    deleteAllocation,
    replaceAllocations,
    refetch: fetchAllocations,
  };
}
