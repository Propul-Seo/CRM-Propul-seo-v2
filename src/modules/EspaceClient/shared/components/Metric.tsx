import type { ReactNode } from 'react';

interface MetricProps {
  value: ReactNode;
  /** Classes additionnelles (couleur, taille si dérogation ponctuelle). */
  className?: string;
}

// Valeur chiffrée premium : Space Grotesk + tabular-nums via la classe
// .ps-metric (échelle fixe partagée par tous les KPI).
export function Metric({ value, className = '' }: MetricProps) {
  return <span className={`ps-metric ${className}`}>{value}</span>;
}
