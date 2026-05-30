import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AccountingEntry } from '../../../hooks/useMonthlyAccounting';
import type { RevenueCategory, RevenuePeriodFilter } from '../constants';

interface CategoryTotals {
  site_internet: number;
  erp: number;
  communication: number;
}

interface CommunicationBreakdown {
  chatbot: number;
  cm: number;
  newsletter: number;
  autre: number;
}

interface AllocationRow {
  id: string;
  entry_id: string;
  revenue_category: string;
  revenue_sous_categorie: string | null;
  amount: number;
}

export function useRevenueBreakdown() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<RevenuePeriodFilter>('year');
  const [categoryFilter, setCategoryFilter] = useState<'all' | RevenueCategory>('all');
  const [clientSearch, setClientSearch] = useState('');

  // Compute date range from period
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: string;
    let end: string;

    if (period === 'month') {
      start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'quarter') {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start = `${now.getFullYear()}-${String(quarterStart + 1).padStart(2, '0')}`;
      const quarterEnd = new Date(now.getFullYear(), quarterStart + 3, 1);
      end = `${quarterEnd.getFullYear()}-${String(quarterEnd.getMonth() + 1).padStart(2, '0')}`;
    } else {
      start = `${now.getFullYear()}-01`;
      end = `${now.getFullYear() + 1}-01`;
    }

    return { start, end };
  }, [period]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch revenue entries in period
      const { data: entriesData, error: entriesErr } = await supabase
        .from('accounting_entries')
        .select('*')
        .eq('type', 'revenue')
        .gte('month_key', dateRange.start)
        .lt('month_key', dateRange.end)
        .order('entry_date', { ascending: false });

      if (entriesErr) throw new Error(entriesErr.message);

      const revenueEntries: AccountingEntry[] = entriesData || [];
      setEntries(revenueEntries);

      // Fetch allocations for these entries
      if (revenueEntries.length > 0) {
        const entryIds = revenueEntries.map((e) => e.id);
        const { data: allocData, error: allocErr } = await supabase
          .from('revenue_allocations')
          .select('*')
          .in('entry_id', entryIds);

        if (allocErr) throw new Error(allocErr.message);
        setAllocations(allocData || []);
      } else {
        setAllocations([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscriptions for both tables
  useEffect(() => {
    const sub = supabase
      .channel('accounting_revenue_breakdown')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_entries' }, () => {
        setTimeout(() => fetchData(), 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revenue_allocations' }, () => {
        setTimeout(() => fetchData(), 500);
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [fetchData]);

  // Build a map: entry_id -> allocations
  const allocationsByEntry = useMemo(() => {
    const map = new Map<string, AllocationRow[]>();
    allocations.forEach((a) => {
      const list = map.get(a.entry_id) || [];
      list.push(a);
      map.set(a.entry_id, list);
    });
    return map;
  }, [allocations]);

  // Compute category totals from allocations (fallback to entry.revenue_category if no allocations)
  const categoryTotals = useMemo<CategoryTotals>(() => {
    const totals: CategoryTotals = { site_internet: 0, erp: 0, communication: 0 };

    entries.forEach((entry) => {
      const entryAllocs = allocationsByEntry.get(entry.id);
      if (entryAllocs && entryAllocs.length > 0) {
        // Use allocations
        entryAllocs.forEach((a) => {
          const cat = a.revenue_category as keyof CategoryTotals;
          if (cat in totals) {
            totals[cat] += Number(a.amount);
          }
        });
      } else if (entry.revenue_category) {
        // Fallback to single category
        const cat = entry.revenue_category as keyof CategoryTotals;
        if (cat in totals) {
          totals[cat] += entry.amount;
        }
      }
    });

    return totals;
  }, [entries, allocationsByEntry]);

  const totalRevenue = useMemo(() => {
    return entries.reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  const categoryPercentages = useMemo(() => {
    if (totalRevenue === 0) return { site_internet: 0, erp: 0, communication: 0 };
    return {
      site_internet: Math.round((categoryTotals.site_internet / totalRevenue) * 100),
      erp: Math.round((categoryTotals.erp / totalRevenue) * 100),
      communication: Math.round((categoryTotals.communication / totalRevenue) * 100),
    };
  }, [categoryTotals, totalRevenue]);

  const chartData = useMemo(() => {
    return [
      { name: 'Site Internet', value: categoryTotals.site_internet, color: '#06b6d4' },
      { name: 'ERP', value: categoryTotals.erp, color: '#8b5cf6' },
      { name: 'Autres sources', value: categoryTotals.communication, color: '#f59e0b' },
    ].filter((d) => d.value > 0);
  }, [categoryTotals]);

  const communicationBreakdown = useMemo<CommunicationBreakdown>(() => {
    const bd: CommunicationBreakdown = { chatbot: 0, cm: 0, newsletter: 0, autre: 0 };

    entries.forEach((entry) => {
      const entryAllocs = allocationsByEntry.get(entry.id);
      if (entryAllocs && entryAllocs.length > 0) {
        entryAllocs
          .filter((a) => a.revenue_category === 'communication')
          .forEach((a) => {
            const sc = a.revenue_sous_categorie as keyof CommunicationBreakdown | null;
            if (sc && sc in bd) bd[sc] += Number(a.amount);
          });
      } else if (entry.revenue_category === 'communication') {
        const sc = entry.revenue_sous_categorie as keyof CommunicationBreakdown | null;
        if (sc && sc in bd) bd[sc] += entry.amount;
      }
    });

    return bd;
  }, [entries, allocationsByEntry]);

  const communicationChartData = useMemo(() => {
    return [
      { name: 'Chatbot', value: communicationBreakdown.chatbot, color: '#06b6d4' },
      { name: 'CM', value: communicationBreakdown.cm, color: '#8b5cf6' },
      { name: 'Newsletter', value: communicationBreakdown.newsletter, color: '#f59e0b' },
      { name: 'Autre', value: communicationBreakdown.autre, color: '#94a3b8' },
    ].filter((d) => d.value > 0);
  }, [communicationBreakdown]);

  // For the detail table, we create "expanded rows" from allocations
  // Each allocation becomes a row with the parent entry info
  const expandedRows = useMemo(() => {
    const rows: Array<AccountingEntry & { alloc_category: string; alloc_sous_categorie: string | null; alloc_amount: number }> = [];

    entries.forEach((entry) => {
      const entryAllocs = allocationsByEntry.get(entry.id);
      if (entryAllocs && entryAllocs.length > 0) {
        entryAllocs.forEach((a) => {
          rows.push({
            ...entry,
            alloc_category: a.revenue_category,
            alloc_sous_categorie: a.revenue_sous_categorie,
            alloc_amount: Number(a.amount),
          });
        });
      } else {
        rows.push({
          ...entry,
          alloc_category: entry.revenue_category || '',
          alloc_sous_categorie: entry.revenue_sous_categorie || null,
          alloc_amount: entry.amount,
        });
      }
    });

    return rows;
  }, [entries, allocationsByEntry]);

  // Apply filters to expanded rows
  const filteredRows = useMemo(() => {
    let filtered = expandedRows;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((r) => r.alloc_category === categoryFilter);
    }

    if (clientSearch.trim()) {
      const search = clientSearch.toLowerCase().trim();
      filtered = filtered.filter((r) => r.description.toLowerCase().includes(search));
    }

    return filtered;
  }, [expandedRows, categoryFilter, clientSearch]);

  // Also keep filtered entries for backward compat
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (categoryFilter !== 'all') {
      // Show entries that have at least one allocation matching the filter
      filtered = filtered.filter((e) => {
        const allocs = allocationsByEntry.get(e.id);
        if (allocs && allocs.length > 0) {
          return allocs.some((a) => a.revenue_category === categoryFilter);
        }
        return e.revenue_category === categoryFilter;
      });
    }

    if (clientSearch.trim()) {
      const search = clientSearch.toLowerCase().trim();
      filtered = filtered.filter((e) => e.description.toLowerCase().includes(search));
    }

    return filtered;
  }, [entries, categoryFilter, clientSearch, allocationsByEntry]);

  return {
    entries,
    filteredEntries,
    filteredRows,
    loading,
    error,
    // Filters
    period,
    setPeriod,
    categoryFilter,
    setCategoryFilter,
    clientSearch,
    setClientSearch,
    // Computed
    categoryTotals,
    totalRevenue,
    categoryPercentages,
    chartData,
    communicationBreakdown,
    communicationChartData,
    allocationsByEntry,
    refetch: fetchData,
  };
}
