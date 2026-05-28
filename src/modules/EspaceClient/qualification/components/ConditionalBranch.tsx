import type { ReactNode } from 'react';

interface ConditionalBranchProps {
  show: boolean;
  children: ReactNode;
}

// Version ultra simple : mount/unmount instantané + classe CSS ps-fade-in
// pour un fade-in léger à l'apparition. Pas de timer, pas de state, pas de
// risque d'animation bloquée. Les versions précédentes (Framer Motion puis
// CSS avec setTimeout) ont buggé chez l'utilisateur — root cause non identifié
// mais ce pattern simple élimine toute la surface de bug possible.
//
// Trade-off : pas d'animation d'exit (unmount instantané). Acceptable pour
// notre cas car les branches conditionnelles métier sont des switch sans retour.
export function ConditionalBranch({ show, children }: ConditionalBranchProps) {
  if (!show) return null;
  return <div className="ps-fade-in">{children}</div>;
}
