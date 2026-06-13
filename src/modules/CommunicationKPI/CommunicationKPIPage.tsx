import { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocialConnectionsCRUD } from '@/hooks/supabase';
import { KPIFiltersBar } from './components/KPIFiltersBar';
import { KPIOverviewCards } from './components/KPIOverviewCards';
import { LinkedInChart } from './components/LinkedInChart';
import { InstagramChart } from './components/InstagramChart';
import { TopPostsTable } from './components/TopPostsTable';
import { useKPIData } from './hooks/useKPIData';

export function CommunicationKPIPage() {
  const {
    loading, overview,
    linkedinDaily, instagramDaily,
    topPosts, users,
    filters, setPeriod, setPlatform, setType, setResponsibleUserId,
  } = useKPIData();
  const { syncMetrics } = useSocialConnectionsCRUD();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await syncMetrics();
    setSyncing(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">KPI</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Analytique & performance</p>
          </div>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sync...' : 'Synchroniser'}
        </Button>
      </div>

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

      <KPIOverviewCards overview={overview} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <LinkedInChart data={linkedinDaily} />
        <InstagramChart data={instagramDaily} />
      </div>

      <TopPostsTable posts={topPosts} />
    </div>
  );
}
