import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

// Conteneur de contenu standard des onglets admin (surface opaque + bordure).
// `interactive` ajoute l'effet hover (bordure violet + surface relevée).
export function AdminCard({ children, className = '', interactive, onClick }: Props) {
  const base = 'rounded-lg border border-border bg-surface-2 px-4 py-3';
  if (interactive || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full text-left transition-colors hover:border-primary/40 hover:bg-surface-3 ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}
