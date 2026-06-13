# KPI Communication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a KPI Communication dashboard page with post metrics tracking, SQL aggregations, and business intelligence charts.

**Architecture:** Hybrid approach — SQL functions for aggregation + materialized views for heavy queries + client-side filtering for dynamic interactions. Metrics are entered manually in PostDetail and displayed in a dedicated KPI page accessible via sidebar.

**Tech Stack:** Supabase (Postgres), React 18, TypeScript, Recharts, shadcn/ui, Tailwind CSS, Zustand

**Design Doc:** `docs/plans/2026-02-24-kpi-communication-design.md`

**Supabase Project ID:** `tbuqctfgjjxnevmsvucl`

---

## Task 1: Database Migration — post_metrics table + indexes

**Files:**
- Apply via Supabase MCP: `apply_migration`

**Step 1: Apply the migration**

Use the Supabase MCP tool `apply_migration` with project_id `tbuqctfgjjxnevmsvucl`, name `create_post_metrics_and_kpi_views`, and this SQL:

```sql
-- ============================================
-- TABLE: post_metrics
-- ============================================
CREATE TABLE post_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  impressions     int DEFAULT 0,
  reach           int DEFAULT 0,
  engagement      int DEFAULT 0,
  clicks          int DEFAULT 0,
  shares          int DEFAULT 0,
  comments_count  int DEFAULT 0,
  saves           int DEFAULT 0,
  leads_count     int DEFAULT 0,
  revenue         numeric(12,2) DEFAULT 0,
  engagement_rate numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0
    THEN ROUND((engagement::numeric / impressions * 100), 2)
    ELSE 0 END
  ) STORED,
  performance_score numeric(5,2) DEFAULT 0,
  source          text DEFAULT 'manual' CHECK (source IN ('manual','linkedin_api','meta_api')),
  measured_at     timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(post_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_post_metrics_post_id ON post_metrics(post_id);
CREATE INDEX idx_post_metrics_source ON post_metrics(source);
CREATE INDEX idx_posts_published_at ON posts(published_at) WHERE status = 'published';

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all post metrics"
  ON post_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert post metrics"
  ON post_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update post metrics"
  ON post_metrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete post metrics"
  ON post_metrics FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- FUNCTION: calculate_performance_score
-- ============================================
CREATE OR REPLACE FUNCTION calculate_performance_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.performance_score := ROUND(
    LEAST(
      (COALESCE(NEW.engagement_rate, 0) * 0.3) +
      (LEAST(COALESCE(NEW.leads_count, 0) * 20, 50) * 0.4) +
      (LEAST(COALESCE(NEW.revenue, 0)::numeric / NULLIF(100, 0), 50) * 0.3),
      100
    ),
    2
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_performance_score
  BEFORE INSERT OR UPDATE ON post_metrics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_performance_score();

-- ============================================
-- MATERIALIZED VIEW: kpi_monthly_overview
-- ============================================
CREATE MATERIALIZED VIEW kpi_monthly_overview AS
SELECT
  date_trunc('month', p.published_at)::date AS month,
  p.platform,
  p.type,
  p.responsible_user_id,
  COUNT(*)::int AS posts_count,
  COALESCE(SUM(pm.impressions), 0)::int AS total_impressions,
  COALESCE(SUM(pm.reach), 0)::int AS total_reach,
  COALESCE(SUM(pm.engagement), 0)::int AS total_engagement,
  COALESCE(SUM(pm.clicks), 0)::int AS total_clicks,
  COALESCE(SUM(pm.leads_count), 0)::int AS total_leads,
  COALESCE(SUM(pm.revenue), 0)::numeric(12,2) AS total_revenue,
  ROUND(COALESCE(AVG(pm.engagement_rate), 0), 2)::numeric(5,2) AS avg_engagement_rate,
  ROUND(COALESCE(AVG(pm.performance_score), 0), 2)::numeric(5,2) AS avg_performance_score,
  CASE WHEN COUNT(*) > 0
    THEN ROUND(COALESCE(SUM(pm.revenue), 0) / COUNT(*), 2)
    ELSE 0
  END::numeric(12,2) AS roi_per_post
FROM posts p
LEFT JOIN post_metrics pm ON pm.post_id = p.id
WHERE p.status = 'published' AND p.published_at IS NOT NULL
GROUP BY month, p.platform, p.type, p.responsible_user_id;

CREATE UNIQUE INDEX idx_kpi_monthly_pk
  ON kpi_monthly_overview(month, platform, type, COALESCE(responsible_user_id, '00000000-0000-0000-0000-000000000000'));

-- ============================================
-- MATERIALIZED VIEW: kpi_daily_metrics
-- ============================================
CREATE MATERIALIZED VIEW kpi_daily_metrics AS
SELECT
  p.published_at::date AS day,
  p.platform,
  p.type,
  COUNT(*)::int AS posts_count,
  COALESCE(SUM(pm.impressions), 0)::int AS impressions,
  COALESCE(SUM(pm.reach), 0)::int AS reach,
  COALESCE(SUM(pm.engagement), 0)::int AS engagement,
  ROUND(COALESCE(AVG(pm.engagement_rate), 0), 2)::numeric(5,2) AS avg_engagement_rate,
  COALESCE(SUM(pm.leads_count), 0)::int AS leads_count,
  COALESCE(SUM(pm.revenue), 0)::numeric(12,2) AS revenue
FROM posts p
LEFT JOIN post_metrics pm ON pm.post_id = p.id
WHERE p.status = 'published' AND p.published_at IS NOT NULL
GROUP BY day, p.platform, p.type;

CREATE UNIQUE INDEX idx_kpi_daily_pk
  ON kpi_daily_metrics(day, platform, type);

-- ============================================
-- MATERIALIZED VIEW: kpi_top_posts
-- ============================================
CREATE MATERIALIZED VIEW kpi_top_posts AS
SELECT
  p.id,
  p.title,
  p.platform,
  p.type,
  p.responsible_user_id,
  p.published_at,
  COALESCE(pm.impressions, 0) AS impressions,
  COALESCE(pm.engagement, 0) AS engagement,
  COALESCE(pm.engagement_rate, 0) AS engagement_rate,
  COALESCE(pm.leads_count, 0) AS leads_count,
  COALESCE(pm.revenue, 0) AS revenue,
  COALESCE(pm.performance_score, 0) AS performance_score
FROM posts p
LEFT JOIN post_metrics pm ON pm.post_id = p.id
WHERE p.status = 'published'
ORDER BY COALESCE(pm.performance_score, 0) DESC;

CREATE UNIQUE INDEX idx_kpi_top_posts_pk ON kpi_top_posts(id);

-- ============================================
-- FUNCTION: refresh_kpi_views
-- ============================================
CREATE OR REPLACE FUNCTION refresh_kpi_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_monthly_overview;
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_daily_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_top_posts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: auto-refresh views on metrics change
-- ============================================
CREATE OR REPLACE FUNCTION trg_refresh_kpi_views()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_kpi_views();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_metrics_refresh_views
  AFTER INSERT OR UPDATE OR DELETE ON post_metrics
  FOR EACH STATEMENT
  EXECUTE FUNCTION trg_refresh_kpi_views();

-- Grant access to materialized views
GRANT SELECT ON kpi_monthly_overview TO authenticated;
GRANT SELECT ON kpi_daily_metrics TO authenticated;
GRANT SELECT ON kpi_top_posts TO authenticated;
```

**Step 2: Verify migration applied**

Use `list_tables` with project_id and schemas `["public"]` to confirm `post_metrics` exists.
Then use `execute_sql` to verify:
```sql
SELECT tablename FROM pg_tables WHERE tablename = 'post_metrics';
SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';
```

**Step 3: Check security advisors**

Use `get_advisors` with type `security` to ensure RLS is properly configured.

---

## Task 2: TypeScript Types for post_metrics

**Files:**
- Modify: `src/types/supabase-types.ts` (after line 247)

**Step 1: Add PostMetrics types**

Add after the `PostCommentRow` interface (line 247) in `src/types/supabase-types.ts`:

```typescript
// ============================================
// Post Metrics
// ============================================
export interface PostMetricsRow {
  id: string;
  post_id: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
  comments_count: number;
  saves: number;
  leads_count: number;
  revenue: number;
  engagement_rate: number;
  performance_score: number;
  source: 'manual' | 'linkedin_api' | 'meta_api';
  measured_at: string;
  created_at: string;
  updated_at: string;
}

export interface PostMetricsInsert {
  post_id: string;
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  shares?: number;
  comments_count?: number;
  saves?: number;
  leads_count?: number;
  revenue?: number;
  source?: 'manual' | 'linkedin_api' | 'meta_api';
}

export interface PostMetricsUpdate {
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  shares?: number;
  comments_count?: number;
  saves?: number;
  leads_count?: number;
  revenue?: number;
  source?: 'manual' | 'linkedin_api' | 'meta_api';
}

// ============================================
// KPI View Types (materialized views)
// ============================================
export interface KPIMonthlyOverview {
  month: string;
  platform: string;
  type: string;
  responsible_user_id: string | null;
  posts_count: number;
  total_impressions: number;
  total_reach: number;
  total_engagement: number;
  total_clicks: number;
  total_leads: number;
  total_revenue: number;
  avg_engagement_rate: number;
  avg_performance_score: number;
  roi_per_post: number;
}

export interface KPIDailyMetrics {
  day: string;
  platform: string;
  type: string;
  posts_count: number;
  impressions: number;
  reach: number;
  engagement: number;
  avg_engagement_rate: number;
  leads_count: number;
  revenue: number;
}

export interface KPITopPost {
  id: string;
  title: string;
  platform: string;
  type: string;
  responsible_user_id: string | null;
  published_at: string;
  impressions: number;
  engagement: number;
  engagement_rate: number;
  leads_count: number;
  revenue: number;
  performance_score: number;
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no type errors.

**Step 3: Commit**

```bash
git add src/types/supabase-types.ts
git commit -m "feat: add PostMetrics and KPI view TypeScript types"
```

---

## Task 3: Supabase Hooks for Metrics

**Files:**
- Create: `src/hooks/supabase/usePostMetricsQuery.ts`
- Create: `src/hooks/supabase/usePostMetricsCRUD.ts`
- Modify: `src/hooks/supabase/index.ts` (add exports)

**Step 1: Create usePostMetricsQuery.ts**

Create `src/hooks/supabase/usePostMetricsQuery.ts`:

```typescript
import { useSupabaseData } from './useSupabaseQuery';
import type { PostMetricsRow, KPIMonthlyOverview, KPIDailyMetrics, KPITopPost } from '@/types/supabase-types';

export function useSupabasePostMetrics(postId?: string) {
  return useSupabaseData<PostMetricsRow>({
    table: 'post_metrics',
    select: '*',
    filters: postId ? { post_id: postId } : undefined,
    orderBy: { column: 'created_at', ascending: false },
  });
}

export function useKPIMonthlyOverview() {
  return useSupabaseData<KPIMonthlyOverview>({
    table: 'kpi_monthly_overview',
    select: '*',
    orderBy: { column: 'month', ascending: false },
  });
}

export function useKPIDailyMetrics() {
  return useSupabaseData<KPIDailyMetrics>({
    table: 'kpi_daily_metrics',
    select: '*',
    orderBy: { column: 'day', ascending: false },
  });
}

export function useKPITopPosts() {
  return useSupabaseData<KPITopPost>({
    table: 'kpi_top_posts',
    select: '*',
    orderBy: { column: 'performance_score', ascending: false },
    limit: 10,
  });
}
```

**Step 2: Create usePostMetricsCRUD.ts**

Create `src/hooks/supabase/usePostMetricsCRUD.ts`:

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { PostMetricsRow, PostMetricsInsert, PostMetricsUpdate, CRUDResult } from '@/types/supabase-types';

export function usePostMetricsCRUD() {
  const [loading, setLoading] = useState(false);

  const upsertMetrics = async (data: PostMetricsInsert): Promise<CRUDResult<PostMetricsRow>> => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('post_metrics')
        .upsert(data, { onConflict: 'post_id' })
        .select()
        .single();

      if (error) throw error;
      toast.success('Métriques sauvegardées');
      return { data: result, error: null };
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde des métriques');
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = async (postId: string, updates: PostMetricsUpdate): Promise<CRUDResult<PostMetricsRow>> => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('post_metrics')
        .update(updates)
        .eq('post_id', postId)
        .select()
        .single();

      if (error) throw error;
      toast.success('Métriques mises à jour');
      return { data: result, error: null };
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour des métriques');
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteMetrics = async (postId: string): Promise<CRUDResult<null>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('post_metrics')
        .delete()
        .eq('post_id', postId);

      if (error) throw error;
      toast.success('Métriques supprimées');
      return { data: null, error: null };
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshKPIViews = async (): Promise<void> => {
    try {
      await supabase.rpc('refresh_kpi_views');
    } catch (error) {
      console.error('Failed to refresh KPI views:', error);
    }
  };

  return {
    loading,
    upsertMetrics,
    updateMetrics,
    deleteMetrics,
    refreshKPIViews,
  };
}
```

**Step 3: Update barrel exports**

In `src/hooks/supabase/index.ts`, add after line 34:

```typescript
// KPI / Metrics hooks
export { useSupabasePostMetrics, useKPIMonthlyOverview, useKPIDailyMetrics, useKPITopPosts } from './usePostMetricsQuery';
export { usePostMetricsCRUD } from './usePostMetricsCRUD';
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 5: Commit**

```bash
git add src/hooks/supabase/usePostMetricsQuery.ts src/hooks/supabase/usePostMetricsCRUD.ts src/hooks/supabase/index.ts
git commit -m "feat: add post metrics and KPI query/CRUD hooks"
```

---

## Task 4: PostDetail Metrics Section

**Files:**
- Create: `src/modules/Communication/components/MetricsSection.tsx`
- Modify: `src/modules/Communication/components/PostDetail.tsx` (add metrics section)

**Step 1: Create MetricsSection.tsx**

Create `src/modules/Communication/components/MetricsSection.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Save, TrendingUp, Users, DollarSign, Eye, MousePointer, Share2, MessageCircle, Bookmark } from 'lucide-react';
import { useSupabasePostMetrics, usePostMetricsCRUD } from '@/hooks/supabase';
import type { PostMetricsInsert } from '@/types/supabase-types';

interface MetricsSectionProps {
  postId: string;
}

const metricFields = [
  { key: 'impressions', label: 'Impressions', icon: Eye, placeholder: '0' },
  { key: 'reach', label: 'Reach', icon: TrendingUp, placeholder: '0' },
  { key: 'engagement', label: 'Engagement', icon: BarChart3, placeholder: '0' },
  { key: 'clicks', label: 'Clics', icon: MousePointer, placeholder: '0' },
  { key: 'shares', label: 'Partages', icon: Share2, placeholder: '0' },
  { key: 'comments_count', label: 'Commentaires', icon: MessageCircle, placeholder: '0' },
  { key: 'saves', label: 'Sauvegardes', icon: Bookmark, placeholder: '0' },
] as const;

const businessFields = [
  { key: 'leads_count', label: 'Leads générés', icon: Users, placeholder: '0' },
  { key: 'revenue', label: 'CA généré (€)', icon: DollarSign, placeholder: '0.00' },
] as const;

type MetricKey = typeof metricFields[number]['key'] | typeof businessFields[number]['key'];

export function MetricsSection({ postId }: MetricsSectionProps) {
  const { data: metricsData } = useSupabasePostMetrics(postId);
  const { upsertMetrics, loading } = usePostMetricsCRUD();
  const existingMetrics = metricsData?.[0];

  const [values, setValues] = useState<Record<MetricKey, string>>({
    impressions: '0',
    reach: '0',
    engagement: '0',
    clicks: '0',
    shares: '0',
    comments_count: '0',
    saves: '0',
    leads_count: '0',
    revenue: '0',
  });

  useEffect(() => {
    if (existingMetrics) {
      setValues({
        impressions: String(existingMetrics.impressions || 0),
        reach: String(existingMetrics.reach || 0),
        engagement: String(existingMetrics.engagement || 0),
        clicks: String(existingMetrics.clicks || 0),
        shares: String(existingMetrics.shares || 0),
        comments_count: String(existingMetrics.comments_count || 0),
        saves: String(existingMetrics.saves || 0),
        leads_count: String(existingMetrics.leads_count || 0),
        revenue: String(existingMetrics.revenue || 0),
      });
    }
  }, [existingMetrics]);

  const handleChange = (key: MetricKey, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const data: PostMetricsInsert = {
      post_id: postId,
      impressions: parseInt(values.impressions) || 0,
      reach: parseInt(values.reach) || 0,
      engagement: parseInt(values.engagement) || 0,
      clicks: parseInt(values.clicks) || 0,
      shares: parseInt(values.shares) || 0,
      comments_count: parseInt(values.comments_count) || 0,
      saves: parseInt(values.saves) || 0,
      leads_count: parseInt(values.leads_count) || 0,
      revenue: parseFloat(values.revenue) || 0,
    };
    await upsertMetrics(data);
  };

  const engagementRate = parseInt(values.impressions) > 0
    ? ((parseInt(values.engagement) / parseInt(values.impressions)) * 100).toFixed(2)
    : '0.00';

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-orange-500" />
          Métriques de performance
          {existingMetrics && (
            <Badge variant="secondary" className="text-xs">
              Score: {existingMetrics.performance_score}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engagement metrics */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Engagement
          </p>
          <div className="grid grid-cols-2 gap-3">
            {metricFields.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Icon className="h-3 w-3" />
                  {label}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-3 w-3" />
                Taux d'engagement
              </Label>
              <div className="h-8 flex items-center px-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm font-medium">
                {engagementRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Business metrics */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Attribution business
          </p>
          <div className="grid grid-cols-2 gap-3">
            {businessFields.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Icon className="h-3 w-3" />
                  {label}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={key === 'revenue' ? '0.01' : '1'}
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          size="sm"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Save className="h-3 w-3 mr-1" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les métriques'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Integrate into PostDetail.tsx**

In `src/modules/Communication/components/PostDetail.tsx`:

Add import at top (after line 6):
```typescript
import { MetricsSection } from './MetricsSection';
```

Add the metrics section after the CommentThread section (after line 102, before the closing tags). Find the line with `<CommentThread` and add after its closing section:

```typescript
        {/* Metrics section - only for published posts */}
        {post.status === 'published' && (
          <MetricsSection postId={post.id} />
        )}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/modules/Communication/components/MetricsSection.tsx src/modules/Communication/components/PostDetail.tsx
git commit -m "feat: add metrics input section to PostDetail for published posts"
```

---

## Task 5: KPI Module — Types & Filters Hook

**Files:**
- Create: `src/modules/CommunicationKPI/types.ts`
- Create: `src/modules/CommunicationKPI/hooks/useKPIFilters.ts`

**Step 1: Create types.ts**

Create `src/modules/CommunicationKPI/types.ts`:

```typescript
export type { KPIMonthlyOverview, KPIDailyMetrics, KPITopPost } from '@/types/supabase-types';

export type PeriodFilter = '7d' | '30d' | '90d' | '12m';
export type PlatformFilter = 'all' | 'linkedin' | 'instagram' | 'newsletter' | 'multi';
export type TypeFilter = 'all' | 'agence' | 'perso' | 'client';

export interface KPIFiltersState {
  period: PeriodFilter;
  platform: PlatformFilter;
  type: TypeFilter;
  responsibleUserId: string | null;
}

export interface OverviewCard {
  label: string;
  value: string | number;
  trend?: number;      // % change vs previous period
  trendUp?: boolean;
  icon: string;
  color: string;
}
```

**Step 2: Create useKPIFilters.ts**

Create `src/modules/CommunicationKPI/hooks/useKPIFilters.ts`:

```typescript
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
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/modules/CommunicationKPI/
git commit -m "feat: add KPI types and filters hook"
```

---

## Task 6: KPI Data Hooks

**Files:**
- Create: `src/modules/CommunicationKPI/hooks/useKPIData.ts`

**Step 1: Create useKPIData.ts**

This single hook aggregates all KPI data and applies filters client-side.

Create `src/modules/CommunicationKPI/hooks/useKPIData.ts`:

```typescript
import { useMemo } from 'react';
import { useKPIMonthlyOverview, useKPIDailyMetrics, useKPITopPosts } from '@/hooks/supabase';
import { useSupabaseUsers } from '@/hooks/supabase';
import { useKPIFilters } from './useKPIFilters';
import type { KPIMonthlyOverview } from '../types';

export function useKPIData() {
  const { data: monthlyData, loading: monthlyLoading } = useKPIMonthlyOverview();
  const { data: dailyData, loading: dailyLoading } = useKPIDailyMetrics();
  const { data: topPostsData, loading: topPostsLoading } = useKPITopPosts();
  const { data: users } = useSupabaseUsers();

  const filtersHook = useKPIFilters();
  const { filters, dateRange, previousDateRange, filterData } = filtersHook;

  // Filtered data
  const filteredMonthly = useMemo(
    () => filterData(monthlyData || [], 'platform', 'type', 'responsible_user_id', 'month'),
    [monthlyData, filterData]
  );

  const filteredDaily = useMemo(
    () => filterData(dailyData || [], 'platform', 'type', undefined, 'day'),
    [dailyData, filterData]
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

  // Previous period data for trends
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

  // Aggregate overview metrics
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
        ? sum(filteredMonthly, 'total_revenue') / sum(filteredMonthly, 'posts_count') || 0
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

  // Platform-specific daily data
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

  // Leads & revenue daily (all platforms combined)
  const leadsRevenueDaily = useMemo(() => {
    const filtered = filterData(dailyData || [], 'platform', 'type', undefined, 'day');
    const byDay: Record<string, { day: string; leads: number; revenue: number }> = {};
    filtered.forEach(d => {
      if (!byDay[d.day]) byDay[d.day] = { day: d.day, leads: 0, revenue: 0 };
      byDay[d.day].leads += d.leads_count;
      byDay[d.day].revenue += Number(d.revenue);
    });
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
  }, [dailyData, filterData]);

  // Type breakdown
  const typeBreakdown = useMemo(() => {
    const types = ['agence', 'perso', 'client'] as const;
    return types.map(type => {
      const items = filteredMonthly.filter(m => m.type === type);
      return {
        type,
        label: type === 'agence' ? 'Agence' : type === 'perso' ? 'Perso' : 'Client',
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
    users: users || [],
    ...filtersHook,
  };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/modules/CommunicationKPI/hooks/useKPIData.ts
git commit -m "feat: add KPI data aggregation hook with filtering"
```

---

## Task 7: KPI Page Structure + Filters Bar

**Files:**
- Create: `src/modules/CommunicationKPI/index.tsx`
- Create: `src/modules/CommunicationKPI/CommunicationKPIPage.tsx`
- Create: `src/modules/CommunicationKPI/components/KPIFiltersBar.tsx`

**Step 1: Create KPIFiltersBar.tsx**

Create `src/modules/CommunicationKPI/components/KPIFiltersBar.tsx`:

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter } from 'lucide-react';
import type { PeriodFilter, PlatformFilter, TypeFilter } from '../types';

interface KPIFiltersBarProps {
  period: PeriodFilter;
  platform: PlatformFilter;
  type: TypeFilter;
  responsibleUserId: string | null;
  users: Array<{ id: string; name: string }>;
  onPeriodChange: (v: PeriodFilter) => void;
  onPlatformChange: (v: PlatformFilter) => void;
  onTypeChange: (v: TypeFilter) => void;
  onResponsibleChange: (v: string | null) => void;
}

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '12m', label: '12 mois' },
];

const platformOptions: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'multi', label: 'Multi' },
];

const typeOptions: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'agence', label: 'Agence' },
  { value: 'perso', label: 'Perso' },
  { value: 'client', label: 'Client' },
];

export function KPIFiltersBar({
  period, platform, type, responsibleUserId, users,
  onPeriodChange, onPlatformChange, onTypeChange, onResponsibleChange,
}: KPIFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        <Filter className="h-4 w-4" />
        Filtres
      </div>

      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodFilter)}>
        <SelectTrigger className="w-[130px] h-9">
          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={platform} onValueChange={(v) => onPlatformChange(v as PlatformFilter)}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Plateforme" />
        </SelectTrigger>
        <SelectContent>
          {platformOptions.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(v) => onTypeChange(v as TypeFilter)}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={responsibleUserId || 'all'}
        onValueChange={(v) => onResponsibleChange(v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Responsable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {users.map(u => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

**Step 2: Create CommunicationKPIPage.tsx**

Create `src/modules/CommunicationKPI/CommunicationKPIPage.tsx`:

```typescript
import { BarChart3 } from 'lucide-react';
import { KPIFiltersBar } from './components/KPIFiltersBar';
import { KPIOverviewCards } from './components/KPIOverviewCards';
import { LinkedInChart } from './components/LinkedInChart';
import { InstagramChart } from './components/InstagramChart';
import { LeadsRevenueChart } from './components/LeadsRevenueChart';
import { TypeBreakdownChart } from './components/TypeBreakdownChart';
import { TopPostsTable } from './components/TopPostsTable';
import { useKPIData } from './hooks/useKPIData';

export function CommunicationKPIPage() {
  const {
    loading, overview,
    linkedinDaily, instagramDaily, leadsRevenueDaily,
    typeBreakdown, topPosts, users,
    filters, setPeriod, setPlatform, setType, setResponsibleUserId,
  } = useKPIData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            KPI Communication
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analytique & performance des contenus
          </p>
        </div>
      </div>

      {/* Filters */}
      <KPIFiltersBar
        period={filters.period}
        platform={filters.platform}
        type={filters.type}
        responsibleUserId={filters.responsibleUserId}
        users={users}
        onPeriodChange={setPeriod}
        onPlatformChange={setPlatform}
        onTypeChange={setType}
        onResponsibleChange={setResponsibleUserId}
      />

      {/* Overview Cards */}
      <KPIOverviewCards overview={overview} />

      {/* Charts Row 1: LinkedIn + Instagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LinkedInChart data={linkedinDaily} />
        <InstagramChart data={instagramDaily} />
      </div>

      {/* Charts Row 2: Leads/Revenue + Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsRevenueChart data={leadsRevenueDaily} />
        <TypeBreakdownChart data={typeBreakdown} />
      </div>

      {/* Top Posts Table */}
      <TopPostsTable posts={topPosts} />
    </div>
  );
}
```

**Step 3: Create index.tsx**

Create `src/modules/CommunicationKPI/index.tsx`:

```typescript
import { CommunicationKPIPage } from './CommunicationKPIPage';

export function CommunicationKPI() {
  return <CommunicationKPIPage />;
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Will fail because chart/table components don't exist yet. That's expected — we'll create them in next tasks.

**Step 5: Commit (skip until all components done)**

We'll commit after completing all components in Tasks 8-10.

---

## Task 8: KPIOverviewCards Component

**Files:**
- Create: `src/modules/CommunicationKPI/components/KPIOverviewCards.tsx`

**Step 1: Create KPIOverviewCards.tsx**

Create `src/modules/CommunicationKPI/components/KPIOverviewCards.tsx`:

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Eye, TrendingUp, Users, DollarSign, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OverviewData {
  postsCount: number;
  totalImpressions: number;
  avgEngagementRate: number;
  totalLeads: number;
  totalRevenue: number;
  roiPerPost: number;
  trends: {
    postsCount: number;
    impressions: number;
    engagementRate: number;
    leads: number;
    revenue: number;
  };
}

interface KPIOverviewCardsProps {
  overview: OverviewData;
}

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
};

const formatCurrency = (n: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

export function KPIOverviewCards({ overview }: KPIOverviewCardsProps) {
  const cards = [
    {
      label: 'Posts publiés',
      value: formatNumber(overview.postsCount),
      trend: overview.trends.postsCount,
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Impressions',
      value: formatNumber(overview.totalImpressions),
      trend: overview.trends.impressions,
      icon: Eye,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label: 'Engagement moyen',
      value: `${overview.avgEngagementRate.toFixed(2)}%`,
      trend: overview.trends.engagementRate,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Leads générés',
      value: formatNumber(overview.totalLeads),
      trend: overview.trends.leads,
      icon: Users,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'CA généré',
      value: formatCurrency(overview.totalRevenue),
      trend: overview.trends.revenue,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'ROI / post',
      value: formatCurrency(overview.roiPerPost),
      trend: null,
      icon: Target,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const trendPositive = card.trend !== null && card.trend > 0;
        const trendNegative = card.trend !== null && card.trend < 0;

        return (
          <Card key={card.label} className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                {card.trend !== null && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    trendPositive ? 'text-green-600 dark:text-green-400' :
                    trendNegative ? 'text-red-600 dark:text-red-400' :
                    'text-gray-400'
                  }`}>
                    {trendPositive && <ArrowUpRight className="h-3 w-3" />}
                    {trendNegative && <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(card.trend).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {card.label}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit (defer to Task 10)**

---

## Task 9: Chart Components

**Files:**
- Create: `src/modules/CommunicationKPI/components/LinkedInChart.tsx`
- Create: `src/modules/CommunicationKPI/components/InstagramChart.tsx`
- Create: `src/modules/CommunicationKPI/components/LeadsRevenueChart.tsx`
- Create: `src/modules/CommunicationKPI/components/TypeBreakdownChart.tsx`

**Step 1: Create LinkedInChart.tsx**

Create `src/modules/CommunicationKPI/components/LinkedInChart.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { KPIDailyMetrics } from '../types';

interface LinkedInChartProps {
  data: KPIDailyMetrics[];
}

export function LinkedInChart({ data }: LinkedInChartProps) {
  const chartData = data.map(d => ({
    ...d,
    dayLabel: format(new Date(d.day), 'dd MMM', { locale: fr }),
  }));

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Linkedin className="h-4 w-4 text-[#0A66C2]" />
          Performance LinkedIn
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">
            Aucune donnée LinkedIn pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                name="Impressions"
                stroke="#0A66C2"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_engagement_rate"
                name="Engagement %"
                stroke="#57B560"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create InstagramChart.tsx**

Create `src/modules/CommunicationKPI/components/InstagramChart.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { KPIDailyMetrics } from '../types';

interface InstagramChartProps {
  data: KPIDailyMetrics[];
}

export function InstagramChart({ data }: InstagramChartProps) {
  const chartData = data.map(d => ({
    ...d,
    dayLabel: format(new Date(d.day), 'dd MMM', { locale: fr }),
  }));

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Instagram className="h-4 w-4 text-[#E4405F]" />
          Performance Instagram
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">
            Aucune donnée Instagram pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="reach"
                name="Reach"
                stroke="#E4405F"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_engagement_rate"
                name="Engagement %"
                stroke="#833AB4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 3: Create LeadsRevenueChart.tsx**

Create `src/modules/CommunicationKPI/components/LeadsRevenueChart.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LeadsRevenueData {
  day: string;
  leads: number;
  revenue: number;
}

interface LeadsRevenueChartProps {
  data: LeadsRevenueData[];
}

export function LeadsRevenueChart({ data }: LeadsRevenueChartProps) {
  const chartData = data.map(d => ({
    ...d,
    dayLabel: format(new Date(d.day), 'dd MMM', { locale: fr }),
  }));

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-500" />
          Leads & Chiffre d'affaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">
            Aucune donnée pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'CA (€)') return [`${value.toFixed(0)} €`, name];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                yAxisId="left"
                dataKey="leads"
                name="Leads"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="CA (€)"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Create TypeBreakdownChart.tsx**

Create `src/modules/CommunicationKPI/components/TypeBreakdownChart.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface TypeData {
  type: string;
  label: string;
  leads: number;
  revenue: number;
  avgPerformance: number;
}

interface TypeBreakdownChartProps {
  data: TypeData[];
}

const COLORS: Record<string, string> = {
  agence: '#3b82f6',
  perso: '#8b5cf6',
  client: '#f59e0b',
};

export function TypeBreakdownChart({ data }: TypeBreakdownChartProps) {
  const chartData = data.map(d => ({
    ...d,
    revenue: Number(d.revenue.toFixed(0)),
    avgPerformance: Number(d.avgPerformance.toFixed(1)),
  }));

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-violet-500" />
          Répartition par type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="leads" name="Leads" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" name="CA (€)" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgPerformance" name="Perf. moy." fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit (defer to Task 10)**

---

## Task 10: TopPostsTable Component

**Files:**
- Create: `src/modules/CommunicationKPI/components/TopPostsTable.tsx`

**Step 1: Create TopPostsTable.tsx**

Create `src/modules/CommunicationKPI/components/TopPostsTable.tsx`:

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowUpDown } from 'lucide-react';
import type { KPITopPost } from '../types';

interface TopPostsTableProps {
  posts: KPITopPost[];
}

type SortKey = 'engagement_rate' | 'leads_count' | 'revenue' | 'performance_score';

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  newsletter: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  multi: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const typeColors: Record<string, string> = {
  agence: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  perso: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
  client: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
};

export function TopPostsTable({ posts }: TopPostsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('performance_score');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...posts].sort((a, b) => {
    const aVal = Number(a[sortKey]) || 0;
    const bVal = Number(b[sortKey]) || 0;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? 'text-orange-500' : ''}`} />
      </div>
    </th>
  );

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top 10 Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plateforme
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <SortHeader label="Engagement" field="engagement_rate" />
                <SortHeader label="Leads" field="leads_count" />
                <SortHeader label="CA" field="revenue" />
                <SortHeader label="Score" field="performance_score" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Aucun post avec des métriques
                  </td>
                </tr>
              ) : (
                sorted.map((post, index) => (
                  <tr
                    key={post.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {post.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${platformColors[post.platform] || ''}`}>
                        {post.platform}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${typeColors[post.type] || ''}`}>
                        {post.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {Number(post.engagement_rate).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {post.leads_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {Number(post.revenue).toFixed(0)} €
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                            style={{ width: `${Math.min(Number(post.performance_score), 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {Number(post.performance_score).toFixed(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build (all components exist now).

**Step 3: Commit all KPI module files**

```bash
git add src/modules/CommunicationKPI/
git commit -m "feat: add CommunicationKPI module with dashboard, charts, and table"
```

---

## Task 11: Sidebar + Layout Integration

**Files:**
- Modify: `src/components/layout/Sidebar.tsx` (lines 130-139 — add sub-item)
- Modify: `src/components/layout/Layout.tsx` (add lazy import + case)

**Step 1: Update Sidebar.tsx**

In `src/components/layout/Sidebar.tsx`:

Add `BarChart3` to the lucide imports (line 19, where MessageSquare is imported).

Then find the communication section items array (around line 137) and add the KPI item:

```typescript
items: [
  { id: 'communication', label: 'Communication', icon: MessageSquare, permission: 'can_view_communication', description: 'Gestion de contenu' },
  { id: 'communication-kpi', label: 'KPI Communication', icon: BarChart3, permission: 'can_view_communication', description: 'Analytique & performance' }
]
```

**Step 2: Update Layout.tsx**

In `src/components/layout/Layout.tsx`:

Add lazy import after line 25 (where Communication is imported):

```typescript
const CommunicationKPI = lazy(() => import('../../modules/CommunicationKPI').then(m => ({ default: m.CommunicationKPI })));
```

Add to modulePermissions object (after line 110):

```typescript
'communication-kpi': 'can_view_communication',
```

Add switch case (after line 172, after the communication case):

```typescript
case 'communication-kpi':
  return wrappedComponent(CommunicationKPI);
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/Layout.tsx
git commit -m "feat: integrate KPI Communication into sidebar and layout routing"
```

---

## Task 12: Final Verification

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build, 0 errors.

**Step 2: Run dev server**

Run: `npm run dev`
Expected: App starts on localhost:5173. Navigate to Communication > KPI Communication. Page loads with filters, empty state cards, and charts.

**Step 3: Run security advisors**

Use Supabase MCP `get_advisors` with type `security` to verify post_metrics has proper RLS.

**Step 4: Update memory**

Update project memory with new module info.
