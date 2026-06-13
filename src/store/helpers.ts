import { toast } from 'sonner';
import { format } from 'date-fns';
import type { AccountingData, AccountingEntry, AccountingSummary, MonthlyAccountingData } from './types';

export const stubAction = (action: string, ...args: unknown[]) => {
  console.log(`TODO: Implement Supabase ${action}`, ...args);
  toast.info('Fonctionnalité en cours de développement - Utilisez Supabase');
};

export const createInitialAccountingData = (): AccountingData => ({
  entries: [],
  monthlyData: {},
  categories: [
    'Revenus',
    'Frais généraux',
    'Marketing',
    'Équipement',
    'Formation',
    'Déplacements',
    'Autres'
  ]
});

export function recalcMonthlyData(
  monthlyData: Record<string, MonthlyAccountingData>,
  entry: AccountingEntry,
  action: 'add' | 'remove'
): Record<string, MonthlyAccountingData> {
  const monthKey = format(new Date(entry.date), 'yyyy-MM');
  const data = { ...monthlyData };

  if (!data[monthKey]) {
    data[monthKey] = {
      month: monthKey,
      revenue: 0,
      expenses: 0,
      netResult: 0,
      entries: []
    };
  }

  if (action === 'add') {
    data[monthKey].entries.push(entry.id);
    if (entry.type === 'income') {
      data[monthKey].revenue += entry.amount;
    } else {
      data[monthKey].expenses += entry.amount;
    }
  } else {
    data[monthKey].entries = data[monthKey].entries.filter(id => id !== entry.id);
    if (entry.type === 'income') {
      data[monthKey].revenue -= entry.amount;
    } else {
      data[monthKey].expenses -= entry.amount;
    }
  }

  data[monthKey].netResult = data[monthKey].revenue - data[monthKey].expenses;
  return data;
}

export function computeAccountingSummary(accountingData: AccountingData): AccountingSummary {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthData = accountingData.monthlyData[currentMonth];
  const totalRevenue = Object.values(accountingData.monthlyData)
    .reduce((sum, month) => sum + month.revenue, 0);
  const totalExpenses = Object.values(accountingData.monthlyData)
    .reduce((sum, month) => sum + month.expenses, 0);
  return {
    currentMonthRevenue: currentMonthData?.revenue || 0,
    currentMonthExpenses: currentMonthData?.expenses || 0,
    currentMonthNetResult: currentMonthData?.netResult || 0,
    totalRevenue,
    totalExpenses,
    totalNetResult: totalRevenue - totalExpenses,
    entriesCount: accountingData.entries.length
  };
}
