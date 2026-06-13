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
  { key: 'leads_count', label: 'Leads generes', icon: Users, placeholder: '0' },
  { key: 'revenue', label: 'CA genere (EUR)', icon: DollarSign, placeholder: '0.00' },
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
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-orange-500" />
          Metriques de performance
          {existingMetrics && (
            <Badge variant="secondary" className="text-xs">
              Score: {existingMetrics.performance_score}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Engagement
          </p>
          <div className="grid grid-cols-2 gap-3">
            {metricFields.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1 text-muted-foreground">
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
              <Label className="text-xs flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Taux d'engagement
              </Label>
              <div className="h-8 flex items-center px-3 bg-surface-2 rounded-md text-sm font-medium">
                {engagementRate}%
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Attribution business
          </p>
          <div className="grid grid-cols-2 gap-3">
            {businessFields.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1 text-muted-foreground">
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
          className="w-full"
        >
          <Save className="h-3 w-3 mr-1" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les metriques'}
        </Button>
      </CardContent>
    </Card>
  );
}
