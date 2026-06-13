export function getRevenueSharePercentage(userName: string): number {
  switch (userName) {
    case 'Paul': return 24.5;
    case 'Team': return 51.0;
    case 'Antoine': return 24.5;
    case 'Baptiste': return 0;
    default: {
      const lower = userName.toLowerCase();
      if (lower.includes('paul')) return 24.5;
      if (lower.includes('team')) return 51.0;
      if (lower.includes('antoine')) return 24.5;
      return 0;
    }
  }
}

export function computeRowMetrics(
  balance: { totalRevenues: number; totalExpenses: number },
  totalRevenues: number,
  totalExpenses: number,
  revenueSharePercentage: number
) {
  const theoreticalRevenues = totalRevenues * (revenueSharePercentage / 100);
  const theoreticalExpenses = totalExpenses / 3;
  const revenueDifference = balance.totalRevenues - theoreticalRevenues;
  const expenseDifference = balance.totalExpenses - theoreticalExpenses;
  const finalTotal = revenueDifference - expenseDifference;

  return { theoreticalRevenues, theoreticalExpenses, revenueDifference, expenseDifference, finalTotal };
}
