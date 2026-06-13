import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRealtimeAccounting } from '../../../hooks/useRealtimeAccounting';
import { useAnnualAccounting } from '../../../hooks/useAnnualAccounting';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

// Format/Parse YYYY-MM ↔ Date (1er jour du mois en local)
function parseMonth(s: string | null): Date {
  if (!s) return new Date();
  const m = s.match(/^(\d{4})-(\d{2})$/);
  if (!m) return new Date();
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(month) || month < 0 || month > 11) return new Date();
  return new Date(year, month, 1);
}
function formatMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useAccountingData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMonth = useMemo(() => parseMonth(searchParams.get('month')), [searchParams]);
  const setSelectedMonth = useCallback((next: Date) => {
    setSearchParams((prev) => {
      const np = new URLSearchParams(prev);
      const today = new Date();
      const isCurrent = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
      if (isCurrent) np.delete('month');
      else np.set('month', formatMonth(next));
      return np;
    }, { replace: true });
  }, [setSearchParams]);
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { annualStats, loading: annualLoading, refreshData: refreshAnnualData } = useAnnualAccounting();
  const {
    stats,
    loading: monthlyLoading,
    accounting_entries,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useRealtimeAccounting(selectedMonth);

  // Realtime subscription for annual refresh
  useEffect(() => {
    const subscription = supabase
      .channel('accounting_annual_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounting_entries'
        },
        () => {
          setTimeout(() => {
            refreshAnnualData();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAnnualData]);

  const currentMonthStats = useMemo(() => {
    if (!stats) {
      return { revenue: 0, expenses: 0, result: 0, transactionCount: 0 };
    }
    return {
      revenue: stats.totalRevenues,
      expenses: stats.totalExpenses,
      result: stats.totalResult,
      transactionCount: accounting_entries?.length || 0
    };
  }, [stats, accounting_entries]);

  const startDate = new Date(2026, 0, 1);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      const prevMonth = new Date(selectedMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      if (prevMonth < startDate) return;
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      const nextMonth = new Date(selectedMonth);
      const today = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      if (nextMonth > today) return;
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
  };

  const canGoPrev = (() => {
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth >= startDate;
  })();

  const canGoNext = (() => {
    const nextMonth = new Date(selectedMonth);
    const today = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth <= today;
  })();

  const generateSparklineData = (base: number, variance: number = 0.3) => {
    return Array.from({ length: 12 }, () =>
      Math.max(0, base * (1 + (Math.random() - 0.5) * variance))
    );
  };

  const loading = annualLoading || monthlyLoading;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  return {
    selectedMonth,
    setSelectedMonth,
    mounted,
    currentYear,
    isMobile,
    annualStats,
    accounting_entries,
    currentMonthStats,
    navigateMonth,
    canGoPrev,
    canGoNext,
    generateSparklineData,
    loading,
    containerVariants,
    refreshAnnualData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
