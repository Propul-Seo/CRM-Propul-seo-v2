import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { RevenueCategory } from '../constants';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface RevenueDistributionChartProps {
  chartData: ChartDataItem[];
  communicationChartData: ChartDataItem[];
  categoryFilter: 'all' | RevenueCategory;
}

export function RevenueDistributionChart({ chartData, communicationChartData, categoryFilter }: RevenueDistributionChartProps) {
  const data = categoryFilter === 'communication' ? communicationChartData : chartData;

  if (data.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-5 flex items-center justify-center h-[340px]">
        <p className="text-muted-foreground text-sm">Aucune donnée à afficher</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-2 to-surface-2/50 border border-border/50 p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        {categoryFilter === 'communication' ? 'Répartition autres sources' : 'Répartition par catégorie'}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`}
            contentStyle={{
              backgroundColor: 'hsl(var(--surface-2))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '16px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
