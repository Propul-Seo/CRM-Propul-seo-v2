import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { AccountingEntry, MonthlyMetrics } from './useMonthlyAccounting';

// Date de début de la comptabilité (Janvier 2026)
const START_MONTH = `${new Date().getFullYear()}-01`;

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function useAccountingByMonth(initialMonth: Date) {
  // Cache local par mois
  const cache = useRef<{ [month: string]: { metrics: MonthlyMetrics | null; accounting_entries: AccountingEntry[] } }>({});
  const [month, setMonthState] = useState<Date>(initialMonth);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [accounting_entries, setTransactions] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limite navigation : Janvier année en cours → aujourd'hui
  const canGoPrev = (targetMonth: Date) => {
    const prev = new Date(targetMonth);
    prev.setMonth(prev.getMonth() - 1);
    return getMonthKey(prev) >= START_MONTH;
  };
  
  const canGoNext = (targetMonth: Date) => {
    const next = new Date(targetMonth);
    const today = new Date();
    next.setMonth(next.getMonth() + 1);
    return getMonthKey(next) <= getMonthKey(today);
  };

  // Fetch accounting_entries et métriques pour le mois courant
  const fetchMonth = useCallback(async (targetMonth: Date) => {
    const monthKey = getMonthKey(targetMonth);
    setLoading(true);
    setError(null);
    try {
      // Vérifier cache
      if (cache.current[monthKey]) {
        setMetrics(cache.current[monthKey].metrics);
        setTransactions(cache.current[monthKey].accounting_entries);
        setLoading(false);
        return;
      }
      // Récupérer métriques
      const { data: metricsData, error: metricsError } = await supabase
        .from('monthly_accounting_metrics')
        .select('*')
        .eq('month', monthKey)
        .single();
      if (metricsError && metricsError.code !== 'PGRST116') {
        throw new Error(metricsError.message);
      }
      // Récupérer accounting_entries
      const { data: txData, error: txError } = await supabase
        .from('accounting_entries')
        .select('*')
        .eq('month_key', monthKey)
        .order('entry_date', { ascending: false });
      if (txError) {
        throw new Error(txError.message);
      }
      cache.current[monthKey] = {
        metrics: metricsData || null,
        accounting_entries: txData || []
      };
      setMetrics(metricsData || null);
      setTransactions(txData || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast.error('Erreur: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch - CORRECTION: utiliser useEffect au lieu de useState
  useEffect(() => {
    fetchMonth(month);
  }, [fetchMonth, month]);

  // Navigation
  const setMonth = (date: Date) => {
    setMonthState(date);
    fetchMonth(date);
  };

  // CRUD
  const addTransaction = async (entry: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_entries')
        .insert({ ...entry, month_key: entry.entry_date.slice(0, 7) })
        .select()
        .single();
      if (error) throw new Error(error.message);
      toast.success('Transaction ajoutée');
      await refetch();
      return { success: true, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur: ' + msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<AccountingEntry>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounting_entries')
        .update({ ...updates, month_key: updates.entry_date ? updates.entry_date.slice(0, 7) : undefined })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      toast.success('Transaction modifiée');
      await refetch();
      return { success: true, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur: ' + msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('accounting_entries')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
      toast.success('Transaction supprimée');
      await refetch();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur: ' + msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Refetch et invalidation cache
  const refetch = async () => {
    const monthKey = getMonthKey(month);
    delete cache.current[monthKey];
    await fetchMonth(month);
  };

  // Liste des mois disponibles (à partir de Janvier de l'année en cours jusqu'à aujourd'hui)
  const monthsAvailable = (() => {
    const result: string[] = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const d = new Date(currentYear, 0, 1); // Janvier de l'année en cours
    while (getMonthKey(d) <= getMonthKey(today)) {
      result.push(getMonthKey(d));
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  })();

  return {
    metrics,
    accounting_entries,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
    setMonth,
    month,
    monthsAvailable,
    canGoPrev: canGoPrev(month),
    canGoNext: canGoNext(month)
  };
} 