import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSupabaseAccountingEntries } from '../../hooks/useSupabaseData';

interface RevenueChartProps {
  isPrivacyMode?: boolean;
}

export function RevenueChart({ isPrivacyMode = false }: RevenueChartProps) {
  const { data: accountingEntries, loading } = useSupabaseAccountingEntries();

  // Générer les données du graphique pour l'année en cours
  const chartData = useMemo(() => {
    if (!accountingEntries) return [];

    const currentYear = new Date().getFullYear();
    const months: Array<{
      month: string;
      revenue: number;
      fullMonth: string;
    }> = [];

    // Initialiser tous les mois de l'année en cours (janvier à décembre)
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
      const monthDate = new Date(currentYear, month - 1, 1); // month - 1 car les mois commencent à 0

      // Filtrer les entrées de ce mois en utilisant month_key
      const monthEntries = accountingEntries.filter(entry => {
        return entry.month_key === monthKey && entry.type === 'revenue';
      });

      // Calculer le CA total du mois
      const totalRevenue = monthEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

      months.push({
        month: isPrivacyMode ? '*****' : format(monthDate, 'MMM', { locale: fr }),
        revenue: totalRevenue,
        fullMonth: format(monthDate, 'MMMM yyyy', { locale: fr })
      });
    }

    return months;
  }, [accountingEntries, isPrivacyMode]);

  if (loading) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-400"></div>
          <p className="text-sm text-violet-100/52">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-violet-100/52">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 28, right: 22, left: 8, bottom: 18 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 5" vertical horizontal />
        <XAxis 
          dataKey="month" 
          tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis 
          tick={{ fill: 'rgba(255,255,255,0.48)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={58}
          tickFormatter={(value) => isPrivacyMode ? '*****' : `${value}€`}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(255,255,255,0.72)', strokeWidth: 1.5 }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '8px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.32)',
          }}
          labelStyle={{ color: '#ddd6fe', fontWeight: 700 }}
          itemStyle={{ color: '#a855f7', fontWeight: 800 }}
          formatter={(value: number) => isPrivacyMode ? ['*****', 'Chiffre d\'affaires'] : [`${value.toLocaleString()}€`, 'Chiffre d\'affaires']}
          labelFormatter={(label, payload) => {
            if (payload && payload[0]) {
              return payload[0].payload.fullMonth;
            }
            return label;
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#9b35ff"
          strokeWidth={4}
          dot={{ fill: '#9b35ff', stroke: '#130d23', strokeWidth: 3, r: 5 }}
          activeDot={{ r: 8, stroke: '#a855f7', strokeWidth: 4, fill: 'white' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
