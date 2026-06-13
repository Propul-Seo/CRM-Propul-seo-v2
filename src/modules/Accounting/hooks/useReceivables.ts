import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { AccountingEntry } from '@/hooks/useMonthlyAccounting';
import { getEffectivePaymentStatus, paymentStatusUpdates } from '@/modules/Accounting/lib/paymentStatus';

export interface ReceivablesData {
  entries: AccountingEntry[]; // revenus non payés, échéance la plus proche d'abord
  pendingTotal: number; // « en attente » (échéance non dépassée ou absente)
  overdueTotal: number; // « en retard » (échéance dépassée)
  total: number; // total dû
  count: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markPaid: (id: string) => Promise<void>;
}

// Toutes les créances clients, tous mois confondus (un impayé d'un mois passé reste dû).
export function useReceivables(): ReceivablesData {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceivables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: qErr } = await supabase
        .from('accounting_entries')
        .select('*')
        .eq('type', 'revenue')
        .eq('payment_status', 'pending')
        .order('due_date', { ascending: true });
      if (qErr) throw new Error(qErr.message);
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  const markPaid = useCallback(async (id: string) => {
    const { error: uErr } = await supabase
      .from('accounting_entries')
      .update(paymentStatusUpdates('paid'))
      .eq('id', id);
    if (uErr) {
      toast.error('Erreur: ' + uErr.message);
      return;
    }
    toast.success('Marqué comme payé');
    await fetchReceivables();
  }, [fetchReceivables]);

  useEffect(() => {
    fetchReceivables();
    const channel = supabase
      .channel('accounting_receivables')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounting_entries' },
        () => {
          setTimeout(() => { fetchReceivables(); }, 500);
        },
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [fetchReceivables]);

  const { pendingTotal, overdueTotal } = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    for (const e of entries) {
      const amount = parseFloat(String(e.amount)) || 0;
      if (getEffectivePaymentStatus(e) === 'overdue') overdue += amount;
      else pending += amount;
    }
    return { pendingTotal: pending, overdueTotal: overdue };
  }, [entries]);

  return {
    entries,
    pendingTotal,
    overdueTotal,
    total: pendingTotal + overdueTotal,
    count: entries.length,
    loading,
    error,
    refetch: fetchReceivables,
    markPaid,
  };
}
