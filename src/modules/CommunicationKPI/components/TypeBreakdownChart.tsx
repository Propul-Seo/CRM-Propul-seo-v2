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

export function TypeBreakdownChart({ data }: TypeBreakdownChartProps) {
  const chartData = data.map(d => ({
    ...d,
    revenue: Number(d.revenue.toFixed(0)),
    avgPerformance: Number(d.avgPerformance.toFixed(1)),
  }));

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-violet-500" />
          Repartition par type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="leads" name="Leads" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" name="CA (\u20AC)" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgPerformance" name="Perf. moy." fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
