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
  linkedin: 'bg-blue-500/15 text-blue-400',
  instagram: 'bg-pink-500/15 text-pink-400',
  newsletter: 'bg-green-500/15 text-green-400',
  multi: 'bg-surface-2 text-foreground',
};

const typeColors: Record<string, string> = {
  agence: 'bg-blue-500/10 text-blue-400',
  perso: 'bg-purple-500/10 text-purple-400',
  client: 'bg-amber-500/10 text-amber-400',
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
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? 'text-orange-500' : ''}`} />
      </div>
    </th>
  );

  return (
    <Card className="border-border">
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
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plateforme</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <SortHeader label="Engagement" field="engagement_rate" />
                <SortHeader label="Leads" field="leads_count" />
                <SortHeader label="CA" field="revenue" />
                <SortHeader label="Score" field="performance_score" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucun post avec des metriques
                  </td>
                </tr>
              ) : (
                sorted.map((post, index) => (
                  <tr key={post.id} className="hover:bg-surface-3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-5">{index + 1}</span>
                        <span className="text-sm font-medium text-foreground truncate max-w-[120px] md:max-w-[200px]">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${platformColors[post.platform] || ''}`}>{post.platform}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${typeColors[post.type] || ''}`}>{post.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{Number(post.engagement_rate).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{post.leads_count}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{Number(post.revenue).toFixed(0)} \u20AC</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" style={{ width: `${Math.min(Number(post.performance_score), 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{Number(post.performance_score).toFixed(1)}</span>
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
