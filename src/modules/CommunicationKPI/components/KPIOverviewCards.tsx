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
      label: 'Posts publies',
      value: formatNumber(overview.postsCount),
      trend: overview.trends.postsCount,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Impressions',
      value: formatNumber(overview.totalImpressions),
      trend: overview.trends.impressions,
      icon: Eye,
      color: 'text-purple-500',
      bg: 'bg-purple-950/30',
    },
    {
      label: 'Engagement moyen',
      value: `${overview.avgEngagementRate.toFixed(2)}%`,
      trend: overview.trends.engagementRate,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-950/30',
    },
    {
      label: 'Leads generes',
      value: formatNumber(overview.totalLeads),
      trend: overview.trends.leads,
      icon: Users,
      color: 'text-orange-500',
      bg: 'bg-orange-950/30',
    },
    {
      label: 'CA genere',
      value: formatCurrency(overview.totalRevenue),
      trend: overview.trends.revenue,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-950/30',
    },
    {
      label: 'ROI / post',
      value: formatCurrency(overview.roiPerPost),
      trend: null as number | null,
      icon: Target,
      color: 'text-amber-500',
      bg: 'bg-amber-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const trendPositive = card.trend !== null && card.trend > 0;
        const trendNegative = card.trend !== null && card.trend < 0;

        return (
          <Card key={card.label} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                {card.trend !== null && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    trendPositive ? 'text-green-400' :
                    trendNegative ? 'text-red-400' :
                    'text-muted-foreground'
                  }`}>
                    {trendPositive && <ArrowUpRight className="h-3 w-3" />}
                    {trendNegative && <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(card.trend).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-lg md:text-xl font-bold text-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {card.label}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
