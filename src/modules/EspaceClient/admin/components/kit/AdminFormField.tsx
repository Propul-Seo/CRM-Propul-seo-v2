import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AdminFormFieldProps {
  /** Libellé affiché au-dessus du champ. */
  label: ReactNode;
  /** Texte d'aide affiché sous le champ (gris, petit). */
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Champ de formulaire admin : Label + contenu (+ hint optionnel).
 * Uniformise l'espacement et la typo des modaux du portail.
 */
export function AdminFormField({ label, hint, htmlFor, className, children }: AdminFormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
