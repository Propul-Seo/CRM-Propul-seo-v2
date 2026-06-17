import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  /** Lève en cas d'échec pour garder le dialog ouvert (le toast informe l'utilisateur). */
  onConfirm: () => Promise<void> | void
}

/**
 * Confirmation simple « Vous êtes sûr ? » (Annuler / Supprimer) pour les
 * suppressions sans saisie. Le dialog se ferme au succès et reste ouvert si
 * `onConfirm` lève une erreur.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = 'Supprimer ?',
  description = 'Cette action est irréversible.',
  confirmLabel = 'Supprimer',
  onConfirm,
}: Props) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault() // empêche la fermeture auto de Radix tant que l'action n'a pas abouti
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // L'erreur a déjà été notifiée (toast) par le callback ; on garde le dialog ouvert.
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
