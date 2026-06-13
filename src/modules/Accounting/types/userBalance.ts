export interface UserBalanceData {
  userId: string;
  userName: string;
  totalRevenues: number;
  totalExpenses: number;
  netBalance: number;
  revenueCount: number;
  expenseCount: number;
}

export interface CanonicalTotals {
  revenues: number;
  expenses: number;
  revenueCount: number;
  expenseCount: number;
}
