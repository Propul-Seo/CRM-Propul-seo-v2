import { useState, useMemo, useCallback } from 'react';
import { subDays, subMonths, startOfDay, format } from 'date-fns';
import type { KPIFiltersState, PeriodFilter, PlatformFilter, TypeFilter } from '../types';

export function useKPIFilters() {
  const [filters, setFilters] = useState<KPIFiltersState>({
    period: '30d',
    platform: 'all',
    type: 'all',
    responsibleUserId: null,
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    const periodMap: Record<PeriodFilter, Date> = {
      '7d': subDays(now, 7),
      '30d': subDays(now, 30),
      '90d': subDays(now, 90),
      '12m': subMonths(now, 12),
    };
    return {
      start: startOfDay(periodMap[filters.period]),
      end: now,
      startStr: format(startOfDay(periodMap[filters.period]), 'yyyy-MM-dd'),
      endStr: format(now, 'yyyy-MM-dd'),
    };
  }, [filters.period]);

  const previousDateRange = useMemo(() => {
    const durationMs = dateRange.end.getTime() - dateRange.start.getTime();
    const prevEnd = dateRange.start;
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    return {
      start: prevStart,
      end: prevEnd,
      startStr: format(prevStart, 'yyyy-MM-dd'),
      endStr: format(prevEnd, 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  const setPeriod = useCallback((period: PeriodFilter) => {
    setFilters(prev => ({ ...prev, period }));
  }, []);

  const setPlatform = useCallback((platform: PlatformFilter) => {
    setFilters(prev => ({ ...prev, platform }));
  }, []);

  const setType = useCallback((type: TypeFilter) => {
    setFilters(prev => ({ ...prev, type }));
  }, []);

  const setResponsibleUserId = useCallback((responsibleUserId: string | null) => {
    setFilters(prev => ({ ...prev, responsibleUserId }));
  }, []);

  const filterData = useCallback(<T extends Record<string, any>>(
    data: T[],
    platformKey = 'platform',
    typeKey = 'type',
    userKey = 'responsible_user_id',
    dateKey = 'day'
  ): T[] => {
    return data.filter(item => {
      if (filters.platform !== 'all' && item[platformKey] !== filters.platform) return false;
      if (filters.type !== 'all' && item[typeKey] !== filters.type) return false;
      if (filters.responsibleUserId && item[userKey] !== filters.responsibleUserId) return false;
      if (dateKey && item[dateKey]) {
        const itemDate = new Date(item[dateKey]);
        if (itemDate < dateRange.start || itemDate > dateRange.end) return false;
      }
      return true;
    });
  }, [filters, dateRange]);

  return {
    filters,
    dateRange,
    previousDateRange,
    setPeriod,
    setPlatform,
    setType,
    setResponsibleUserId,
    filterData,
  };
}
