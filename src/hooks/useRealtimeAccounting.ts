import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { AccountingEntry, MonthlyMetrics } from './useMonthlyAccounting';

// Date de début de la comptabilité (Janvier de l'année en cours)
const START_MONTH = `${new Date().getFullYear()}-01`;

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function dedupeTransactions(entries: AccountingEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function isSameTransactionDraft(a: AccountingEntry, b: AccountingEntry) {
  return (
    a.type === b.type &&
    Number(a.amount) === Number(b.amount) &&
    a.description === b.description &&
    a.entry_date === b.entry_date &&
    (a.category ?? '') === (b.category ?? '') &&
    (a.month_key ?? a.entry_date.slice(0, 7)) === (b.month_key ?? b.entry_date.slice(0, 7)) &&
    (a.revenue_category ?? '') === (b.revenue_category ?? '') &&
    (a.revenue_sous_categorie ?? '') === (b.revenue_sous_categorie ?? '')
  );
}

export interface RealtimeStats {
  totalRevenues: number;
  totalExpenses: number;
  totalResult: number;
  monthlyStats: {
    [month: string]: {
      revenues: number;
      expenses: number;
      result: number;
      count: number;
    };
  };
}

export const useRealtimeAccounting = (selectedMonth: Date) => {
  const [accounting_entries, setTransactions] = useState<AccountingEntry[]>([]);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [stats, setStats] = useState<RealtimeStats>({
    totalRevenues: 0,
    totalExpenses: 0,
    totalResult: 0,
    monthlyStats: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set());
  
  const monthKey = getMonthKey(selectedMonth);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const optimisticUpdatesRef = useRef<Set<string>>(new Set());

  const updateOptimisticUpdates = useCallback((updater: (prev: Set<string>) => Set<string>) => {
    setOptimisticUpdates((prev) => {
      const next = updater(prev);
      optimisticUpdatesRef.current = next;
      return next;
    });
  }, []);

  // Charger données initiales
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer accounting_entries du mois
      const { data: txData, error: txError } = await supabase
        .from('accounting_entries')
        .select('*')
        .eq('month_key', monthKey)
        .order('entry_date', { ascending: false });

      if (txError) throw new Error(txError.message);

      // Récupérer métriques du mois
      const { data: metricsData, error: metricsError } = await supabase
        .from('monthly_accounting_metrics')
        .select('*')
        .eq('month', monthKey)
        .single();

      if (metricsError && metricsError.code !== 'PGRST116') {
        throw new Error(metricsError.message);
      }

      const cleanTransactions = dedupeTransactions(txData || []);
      setTransactions(cleanTransactions);
      setMetrics(metricsData || null);
      calculateStats(cleanTransactions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast.error('Erreur chargement: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  // Calculer statistiques
  const calculateStats = useCallback((accounting_entriesData: AccountingEntry[]) => {
    const revenues = accounting_entriesData
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const expenses = accounting_entriesData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Stats par mois
    const monthlyStats: RealtimeStats['monthlyStats'] = {};
    const months = [...new Set(accounting_entriesData.map(t => t.entry_date.slice(0, 7)))];
    
    months.forEach(month => {
      const monthTransactions = accounting_entriesData.filter(t => t.entry_date.startsWith(month));
      const monthRevenues = monthTransactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
      monthlyStats[month] = {
        revenues: monthRevenues,
        expenses: monthExpenses,
        result: monthRevenues - monthExpenses,
        count: monthTransactions.length
      };
    });

    setStats({
      totalRevenues: revenues,
      totalExpenses: expenses,
      totalResult: revenues - expenses,
      monthlyStats
    });
  }, []);

  // Optimistic Updates
  const addOptimisticTransaction = useCallback((newTransaction: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticTransaction: AccountingEntry = {
      ...newTransaction,
      id: optimisticId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTransactions(current => {
      const updated = dedupeTransactions([optimisticTransaction, ...current]);
      calculateStats(updated);
      return updated;
    });
    updateOptimisticUpdates((prev) => {
      const next = new Set(prev);
      next.add(optimisticId);
      return next;
    });

    return optimisticId;
  }, [calculateStats, updateOptimisticUpdates]);

  const updateOptimisticTransaction = useCallback((id: string, updates: Partial<AccountingEntry>) => {
    setTransactions(prev => {
      const updated = prev.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      calculateStats(updated);
      return updated;
    });
  }, [calculateStats]);

  const removeOptimisticTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      calculateStats(updated);
      return updated;
    });
    updateOptimisticUpdates(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, [calculateStats, updateOptimisticUpdates]);

  // CRUD Operations avec Optimistic Updates
  const addTransaction = useCallback(async (entry: Omit<AccountingEntry, 'id' | 'created_at' | 'updated_at'>) => {
    const optimisticId = addOptimisticTransaction(entry);

    try {
      const { data, error } = await supabase
        .from('accounting_entries')
        .insert({ ...entry, month_key: entry.entry_date.slice(0, 7) })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Remplacer l'optimistic update par la vraie donnée
      setTransactions(prev => {
        const replaced = prev.map(t => t.id === optimisticId ? data : t);
        const updated = dedupeTransactions(
          replaced.some(t => t.id === data.id) ? replaced : [data, ...replaced]
        );
        calculateStats(updated);
        return updated;
      });

      updateOptimisticUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticId);
        return newSet;
      });

      toast.success('Transaction ajoutée');
      return { success: true, data };
    } catch (err) {
      // Rollback en cas d'erreur
      removeOptimisticTransaction(optimisticId);
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur: ' + msg);
      return { success: false, error: msg };
    }
  }, [addOptimisticTransaction, removeOptimisticTransaction, calculateStats, updateOptimisticUpdates]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<AccountingEntry>) => {
    const originalTransaction = accounting_entries.find(t => t.id === id);
    if (!originalTransaction) return { success: false, error: 'Transaction non trouvée' };

    // Optimistic update
    updateOptimisticTransaction(id, updates);

    try {
      const { data, error } = await supabase
        .from('accounting_entries')
        .update({ ...updates, month_key: updates.entry_date ? updates.entry_date.slice(0, 7) : undefined })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Mettre à jour avec la vraie donnée
      setTransactions(prev => {
        const updated = prev.map(t => t.id === id ? data : t);
        calculateStats(updated);
        return updated;
      });

      toast.success('Transaction modifiée');
      return { success: true, data };
    } catch (err) {
      // Rollback en cas d'erreur
      updateOptimisticTransaction(id, originalTransaction);
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur: ' + msg);
      return { success: false, error: msg };
    }
  }, [accounting_entries, updateOptimisticTransaction, calculateStats]);

  const deleteTransaction = useCallback(async (id: string) => {
    const originalTransaction = accounting_entries.find(t => t.id === id);
    if (!originalTransaction) return { success: false, error: 'Transaction non trouvée' };

    // Optimistic update
    removeOptimisticTransaction(id);

    try {
      const { error } = await supabase
        .from('accounting_entries')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);

      toast.success('Transaction supprimée');
      return { success: true };
    } catch (err) {
      // Rollback en cas d'erreur
      setTransactions(prev => {
        const updated = [...prev, originalTransaction];
        calculateStats(updated);
        return updated;
      });
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur: ' + msg);
      return { success: false, error: msg };
    }
  }, [accounting_entries, removeOptimisticTransaction, calculateStats]);

  // Subscription temps réel
  useEffect(() => {
    fetchData();

    // Créer la subscription
    subscriptionRef.current = supabase
      .channel('accounting_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'accounting_entries',
          filter: `month_key=eq.${monthKey}`
        }, 
        (payload) => {
          logger.debug('📊 Transaction changée:', payload);

          const newRecord = payload.new as AccountingEntry | null;
          const oldRecord = payload.old as Partial<AccountingEntry> & { id?: string };

          if (payload.eventType === 'INSERT' && newRecord) {
            setTransactions(prev => {
              const existingIndex = prev.findIndex(t => t.id === newRecord.id);
              const optimisticIndex = prev.findIndex(t =>
                optimisticUpdatesRef.current.has(t.id) &&
                t.id.startsWith('optimistic_') &&
                isSameTransactionDraft(t, newRecord)
              );

              let updated: AccountingEntry[];
              if (existingIndex >= 0) {
                updated = prev.map(t => t.id === newRecord.id ? newRecord : t);
              } else if (optimisticIndex >= 0) {
                updated = prev.map((t, index) => index === optimisticIndex ? newRecord : t);
              } else {
                updated = [newRecord, ...prev];
              }

              updated = dedupeTransactions(updated);
              calculateStats(updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE' && newRecord) {
            setTransactions(prev => {
              const updated = dedupeTransactions(prev.map(t =>
                t.id === newRecord.id ? newRecord : t
              ));
              calculateStats(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE' && oldRecord?.id) {
            setTransactions(prev => {
              const updated = prev.filter(t => t.id !== oldRecord.id);
              calculateStats(updated);
              return updated;
            });
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_accounting_metrics',
          filter: `month=eq.${monthKey}`
        },
        (payload) => {
          logger.debug('📊 Métriques changées:', payload);
          if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && payload.new) {
            setMetrics(payload.new as MonthlyMetrics);
          }
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [monthKey, fetchData, calculateStats]);

  return {
    accounting_entries,
    metrics,
    stats,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshData: fetchData,
    optimisticUpdates: Array.from(optimisticUpdates)
  };
}; 
