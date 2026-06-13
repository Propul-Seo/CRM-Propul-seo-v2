// Calcul pur du taux de marge (résultat / chiffre d'affaires).
export function computeMarginRate(result: number, revenue: number): number | null {
  if (!Number.isFinite(revenue) || revenue <= 0) return null;
  return (result / revenue) * 100;
}

export function formatMarginRate(rate: number | null): string {
  if (rate === null) return '—';
  return `${rate.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}
