import { useMemo } from 'react';
import { useKPIMonthlyOverview, useKPIDailyMetrics, useKPITopPosts, useSupabaseUsers } from '@/hooks/supabase';
import { useKPIFilters } from './useKPIFilters';
import type { KPIMonthlyOverview } from '../types';

export function useKPIData() {
  const { data: monthlyData, loading: monthlyLoading } = useKPIMonthlyOverview();
  const { data: dailyData, loading: dailyLoading } = useKPIDailyMetrics();
  const { data: topPostsData, loading: topPostsLoading } = useKPITopPosts();
  const { data: users } = useSupabaseUsers();

  const filtersHook = useKPIFilters();
  const { filters, dateRange, previousDateRange, filterData } = filtersHook;

  const filteredMonthly = useMemo(
    () => filterData(monthlyData || [], 'platform', 'type', 'responsible_user_id', 'month'),
    [monthlyData, filterData]
  );

  const filteredTopPosts = useMemo(() => {
    if (!topPostsData) return [];
    return topPostsData.filter(p => {
      if (filters.platform !== 'all' && p.platform !== filters.platform) return false;
      if (filters.type !== 'all' && p.type !== filters.type) return false;
      if (filters.responsibleUserId && p.responsible_user_id !== filters.responsibleUserId) return false;
      return true;
    }).slice(0, 10);
  }, [topPostsData, filters]);

  const previousMonthly = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.filter(item => {
      const date = new Date(item.month);
      if (date < previousDateRange.start || date > previousDateRange.end) return false;
      if (filters.platform !== 'all' && item.platform !== filters.platform) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.responsibleUserId && item.responsible_user_id !== filters.responsibleUserId) return false;
      return true;
    });
  }, [monthlyData, previousDateRange, filters]);

  const overview = useMemo(() => {
    const sum = (items: KPIMonthlyOverview[], key: keyof KPIMonthlyOverview) =>
      items.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

    const current = {
      postsCount: sum(filteredMonthly, 'posts_count'),
      totalImpressions: sum(filteredMonthly, 'total_impressions'),
      totalLeads: sum(filteredMonthly, 'total_leads'),
      totalRevenue: sum(filteredMonthly, 'total_revenue'),
      avgEngagementRate: filteredMonthly.length > 0
        ? filteredMonthly.reduce((a, b) => a + Number(b.avg_engagement_rate), 0) / filteredMonthly.length
        : 0,
      roiPerPost: filteredMonthly.length > 0
        ? (sum(filteredMonthly, 'total_revenue') / sum(filteredMonthly, 'posts_count')) || 0
        : 0,
    };

    const prev = {
      postsCount: sum(previousMonthly, 'posts_count'),
      totalImpressions: sum(previousMonthly, 'total_impressions'),
      totalLeads: sum(previousMonthly, 'total_leads'),
      totalRevenue: sum(previousMonthly, 'total_revenue'),
      avgEngagementRate: previousMonthly.length > 0
        ? previousMonthly.reduce((a, b) => a + Number(b.avg_engagement_rate), 0) / previousMonthly.length
        : 0,
    };

    const trend = (curr: number, previous: number) =>
      previous > 0 ? ((curr - previous) / previous) * 100 : curr > 0 ? 100 : 0;

    return {
      ...current,
      trends: {
        postsCount: trend(current.postsCount, prev.postsCount),
        impressions: trend(current.totalImpressions, prev.totalImpressions),
        leads: trend(current.totalLeads, prev.totalLeads),
        revenue: trend(current.totalRevenue, prev.totalRevenue),
        engagementRate: trend(current.avgEngagementRate, prev.avgEngagementRate),
      },
    };
  }, [filteredMonthly, previousMonthly]);

  const linkedinDaily = useMemo(
    () => (dailyData || []).filter(d => d.platform === 'linkedin')
      .filter(d => {
        const date = new Date(d.day);
        return date >= dateRange.start && date <= dateRange.end;
      })
      .sort((a, b) => a.day.localeCompare(b.day)),
    [dailyData, dateRange]
  );

  const instagramDaily = useMemo(
    () => (dailyData || []).filter(d => d.platform === 'instagram')
      .filter(d => {
        const date = new Date(d.day);
        return date >= dateRange.start && date <= dateRange.end;
      })
      .sort((a, b) => a.day.localeCompare(b.day)),
    [dailyData, dateRange]
  );

  const leadsRevenueDaily = useMemo(() => {
    const filtered = filterData(dailyData || [], 'platform', 'type', undefined as any, 'day');
    const byDay: Record<string, { day: string; leads: number; revenue: number }> = {};
    filtered.forEach(d => {
      if (!byDay[d.day]) byDay[d.day] = { day: d.day, leads: 0, revenue: 0 };
      byDay[d.day].leads += d.leads_count;
      byDay[d.day].revenue += Number(d.revenue);
    });
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
  }, [dailyData, filterData]);

  const typeBreakdown = useMemo(() => {
    const types = ['agence', 'perso', 'client', 'informatif'] as const;
    return types.map(type => {
      const items = filteredMonthly.filter(m => m.type === type);
      return {
        type,
        label: type === 'agence' ? 'Agence' : type === 'perso' ? 'Perso' : type === 'client' ? 'Client' : 'Informatif',
        leads: items.reduce((a, b) => a + b.total_leads, 0),
        revenue: items.reduce((a, b) => a + Number(b.total_revenue), 0),
        avgPerformance: items.length > 0
          ? items.reduce((a, b) => a + Number(b.avg_performance_score), 0) / items.length
          : 0,
      };
    });
  }, [filteredMonthly]);

  const loading = monthlyLoading || dailyLoading || topPostsLoading;

  return {
    loading,
    overview,
    linkedinDaily,
    instagramDaily,
    leadsRevenueDaily,
    typeBreakdown,
    topPosts: filteredTopPosts,
    users: (users || []).filter(u => u.is_active !== false),
    ...filtersHook,
  };
}
