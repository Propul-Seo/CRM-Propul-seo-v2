import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Largeur du modal : 'md' (défaut) ou 'lg' pour les formulaires denses. */
  size?: 'md' | 'lg';
  /** Champs du formulaire (empilés avec un espacement uniforme). */
  children: ReactNode;
  /** Message d'erreur affiché au-dessus du footer. */
  formError?: string | null;
  /** Déclenché par le bouton de validation. */
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  /** Bouton de validation désactivé (en plus de `submitting`). */
  submitDisabled?: boolean;
  /** Appelé à la fermeture (Annuler / croix / Échap) — utile pour reset. */
  onClose?: () => void;
}

/**
 * Modal de formulaire admin du portail : header + corps + footer (Annuler / Valider),
 * gestion uniforme du loading, des erreurs et du reset à la fermeture.
 * Référence de design : AdminInvoiceForm.
 */
export function AdminFormDialog({
  open, onOpenChange, title, description, size = 'md', children,
  formError, onSubmit, submitting = false, submitLabel, cancelLabel = 'Annuler',
  submitDisabled = false, onClose,
}: AdminFormDialogProps) {
  function handleOpenChange(next: boolean) {
    if (!next) onClose?.();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(size === 'lg' ? 'max-w-lg' : 'max-w-md')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          {children}
          {formError && <p className="text-sm text-red-300">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>{cancelLabel}</Button>
          <Button onClick={onSubmit} disabled={submitting || submitDisabled}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
