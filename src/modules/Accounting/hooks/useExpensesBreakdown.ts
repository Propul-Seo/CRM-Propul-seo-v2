import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AccountingEntry } from '@/hooks/useMonthlyAccounting';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type RevenuePeriodFilter } from '../constants';

interface ExpenseChartItem {
  name: string;
  value: number;
  color: string;
}

function computeDateRange(period: RevenuePeriodFilter): { start: string; end: string } {
  const now = new Date();
  if (period === 'month') {
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}` };
  }
  if (period === 'quarter') {
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    const start = `${now.getFullYear()}-${String(qStart + 1).padStart(2, '0')}`;
    const qEnd = new Date(now.getFullYear(), qStart + 3, 1);
    return { start, end: `${qEnd.getFullYear()}-${String(qEnd.getMonth() + 1).padStart(2, '0')}` };
  }
  return { start: `${now.getFullYear()}-01`, end: `${now.getFullYear() + 1}-01` };
}

function normalizeCategory(category: string | null | undefined): ExpenseCategory {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found ? found.value : 'other';
}

export function useExpensesBreakdown() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<RevenuePeriodFilter>('year');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [search, setSearch] = useState('');

  const dateRange = useMemo(() => computeDateRange(period), [period]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accounting_entries')
      .select('*')
      .eq('type', 'expense')
      .gte('month_key', dateRange.start)
      .lt('month_key', dateRange.end)
      .order('entry_date', { ascending: false });
    if (!error) setEntries((data as AccountingEntry[]) || []);
    setLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const sub = supabase
      .channel('accounting_expenses_breakdown')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_entries' }, () => {
        setTimeout(() => fetchData(), 500);
      })
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, [fetchData]);

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (categoryFilter !== 'all') list = list.filter((e) => normalizeCategory(e.category) === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }
    return list;
  }, [entries, categoryFilter, search]);

  // Le camembert suit les filtres actifs (catégorie + recherche) pour rester cohérent avec le tableau.
  const chartData = useMemo<ExpenseChartItem[]>(() => {
    const totals = new Map<ExpenseCategory, number>();
    filteredEntries.forEach((e) => {
      const cat = normalizeCategory(e.category);
      totals.set(cat, (totals.get(cat) ?? 0) + Number(e.amount));
    });
    return EXPENSE_CATEGORIES.map((c) => ({ name: c.label, value: totals.get(c.value) ?? 0, color: c.color })).filter(
      (d) => d.value > 0,
    );
  }, [filteredEntries]);

  return {
    loading,
    period,
    setPeriod,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    chartData,
    filteredEntries,
  };
}
