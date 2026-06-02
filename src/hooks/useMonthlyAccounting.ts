// =====================================================
// HOOK: COMPTABILITÉ MENSUELLE
// =====================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface MonthlyMetrics {
  id: string;
  month: string;
  month_label: string;
  total_revenue: number;
  total_expenses: number;
  net_result: number;
  revenue_count: number;
  expense_count: number;
  is_current_month: boolean;
  is_closed: boolean;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountingEntry {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  category?: string;
  entry_date: string;
  month_key: string;
  responsible_user_id?: string | null;
  responsible_user_name?: string | null;
  revenue_category?: 'site_internet' | 'erp' | 'communication' | null;
  revenue_sous_categorie?: 'chatbot' | 'cm' | 'newsletter' | 'autre' | null;
  payment_status?: 'paid' | 'pending' | 'overdue';
  due_date?: string | null;
  payment_date?: string | null;
  project_id?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyAccountingData {
  metrics: MonthlyMetrics | null;
  entries: AccountingEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMonthlyAccounting(selectedMonth: Date): MonthlyAccountingData {
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthKey = selectedMonth.toISOString().slice(0, 7); // Format: '2025-07'

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les métriques du mois
      const { data: metricsData, error: metricsError } = await supabase
        .from('monthly_accounting_metrics')
        .select('*')
        .eq('month', monthKey)
        .single();

      if (metricsError && metricsError.code !== 'PGRST116') {
        throw new Error(`Erreur lors de la récupération des métriques: ${metricsError.message}`);
      }

      // Récupérer les entrées du mois
      const { data: entriesData, error: entriesError } = await supabase
        .from('accounting_entries')
        .select('*')
        .eq('month_key', monthKey)
        .order('entry_date', { ascending: false });

      if (entriesError) {
        throw new Error(`Erreur lors de la récupération des entrées: ${entriesError.message}`);
      }

      setMetrics(metricsData);
      setEntries(entriesData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [monthKey]);

  const refetch = async () => {
    await fetchMonthlyData();
  };

  return {
    metrics,
    entries,
    loading,
    error,
    refetch
  };
}

// Hook pour créer une entrée comptable
export function useAccountingCRUD() {
  const [loading, setLoading] = useState(false);

  const createEntry = async (entryData: {
    type: 'revenue' | 'expense';
    amount: number;
    description: string;
    category?: string;
    entry_date: string;
    revenue_category?: string | null;
    revenue_sous_categorie?: string | null;
  }) => {
    try {
      setLoading(true);

      const monthKey = entryData.entry_date.slice(0, 7);
      
      const { data, error } = await supabase
        .from('accounting_entries')
        .insert({
          ...entryData,
          month_key: monthKey
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création: ${error.message}`);
      }

      toast.success('Entrée comptable créée avec succès');
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (id: string, updates: Partial<AccountingEntry>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('accounting_entries')
        .update({
          ...updates,
          month_key: updates.entry_date ? updates.entry_date.slice(0, 7) : undefined
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      toast.success('Entrée comptable mise à jour avec succès');
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('accounting_entries')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      toast.success('Entrée comptable supprimée avec succès');
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    createEntry,
    updateEntry,
    deleteEntry,
    loading
  };
}

// Hook pour récupérer l'historique des mois
export function useMonthlyHistory() {
  const [history, setHistory] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('monthly_accounting_metrics')
        .select('*')
        .order('month', { ascending: false })
        .limit(12); // Derniers 12 mois

      if (error) {
        throw new Error(`Erreur lors de la récupération de l'historique: ${error.message}`);
      }

      setHistory(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
} 