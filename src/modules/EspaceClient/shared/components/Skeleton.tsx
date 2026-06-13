interface SkeletonProps {
  /** Classes Tailwind de dimensionnement/forme (ex. "h-4 w-32 rounded-md"). */
  className?: string;
}

// Bloc de chargement shimmer. S'appuie sur l'utilitaire .ps-skeleton du
// portal-theme.css (dégradé violet animé). À composer pour reproduire la forme
// du contenu en cours de chargement plutôt qu'un « Chargement… » textuel.
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`ps-skeleton ${className}`} />;
}
