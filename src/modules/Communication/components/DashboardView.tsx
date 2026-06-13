import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, AlertTriangle, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { PostRow } from '../../../types/supabase-types';
import { isThisWeek, isPast, parseISO } from 'date-fns';

interface DashboardViewProps {
  posts: PostRow[];
  onPostClick: (post: PostRow) => void;
}

const TYPE_COLORS: Record<string, string> = {
  agence: '#764AC9',
  perso: '#9263D5',
  client: '#10b981',
  informatif: '#3B82F6',
};

const TYPE_LABELS: Record<string, string> = {
  agence: 'Agence',
  perso: 'Personnel',
  client: 'Client',
  informatif: 'Informatif',
};

export function DashboardView({ posts, onPostClick }: DashboardViewProps) {
  const postsThisWeek = useMemo(() => {
    return posts.filter(p =>
      p.scheduled_at && isThisWeek(parseISO(p.scheduled_at), { weekStartsOn: 1 })
    );
  }, [posts]);

  const overduePosts = useMemo(() => {
    return posts.filter(p =>
      p.scheduled_at &&
      isPast(parseISO(p.scheduled_at)) &&
      p.status !== 'published'
    );
  }, [posts]);

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [posts]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = { agence: 0, perso: 0, client: 0, informatif: 0 };
    posts.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: TYPE_LABELS[name] || name,
      value,
      color: TYPE_COLORS[name as keyof typeof TYPE_COLORS] || '#6b7280',
    }));
  }, [posts]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Posts cette semaine */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-primary" />
            Posts cette semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postsThisWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun post prevu cette semaine</p>
          ) : (
            <div className="space-y-2">
              {postsThisWeek.map(post => (
                <div key={post.id} onClick={() => onPostClick(post)} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-3 cursor-pointer transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{post.scheduled_at ? formatDate(post.scheduled_at) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts en retard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Posts en retard
            {overduePosts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{overduePosts.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overduePosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun post en retard</p>
          ) : (
            <div className="space-y-2">
              {overduePosts.slice(0, 5).map(post => (
                <div key={post.id} onClick={() => onPostClick(post)} className="flex items-center justify-between p-2 rounded-lg hover:bg-red-900/20 cursor-pointer transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-red-500">{post.scheduled_at ? formatDate(post.scheduled_at) : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Derniers posts modifies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" />
            Derniers modifies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPosts.map(post => (
              <div key={post.id} onClick={() => onPostClick(post)} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-3 cursor-pointer transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(post.updated_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Repartition par type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-purple-600" />
            Repartition par type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnee</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={2}>
                    {typeDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {typeDistribution.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                    <span className="text-sm font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
