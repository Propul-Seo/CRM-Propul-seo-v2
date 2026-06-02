// Calcul pur de la variation entre deux valeurs (mois N vs N-1).
export type DeltaTrend = 'up' | 'down' | 'flat';

export interface DeltaResult {
  absolute: number;
  percent: number | null; // null si previous === 0 (pas de division)
  trend: DeltaTrend;
  isGood: boolean; // true => à afficher en vert
}

export function computeDelta(
  current: number,
  previous: number,
  opts: { lowerIsBetter?: boolean } = {},
): DeltaResult {
  const absolute = current - previous;
  const percent = previous === 0 ? null : (absolute / Math.abs(previous)) * 100;
  const trend: DeltaTrend = absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'flat';
  const lowerIsBetter = opts.lowerIsBetter ?? false;
  const isGood = trend === 'flat' ? false : lowerIsBetter ? absolute < 0 : absolute > 0;
  return { absolute, percent, trend, isGood };
}
