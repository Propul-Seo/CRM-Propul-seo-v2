import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface TypedDeleteDialogDependency {
  label: string
  count: number
  severity?: 'low' | 'medium' | 'high'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  entityName: string
  dependencies?: TypedDeleteDialogDependency[]
  archiveCta?: { label: string; onConfirm: () => Promise<void> | void }
  deleteCta: { label: string; onConfirm: () => Promise<void> | void }
  description?: string
}

/**
 * Dialog de confirmation destructive avec saisie obligatoire du nom de l'entité.
 *
 * - Si `archiveCta` est fourni, propose un 2e bouton "Archiver" (non destructif).
 * - Le bouton "Supprimer" reste désactivé tant que l'utilisateur n'a pas tapé
 *   le `entityName` exact.
 * - Les dépendances de sévérité 'high' sont mises en avant en rouge.
 */
export function TypedDeleteDialog({
  open, onOpenChange,
  entityLabel, entityName,
  dependencies = [],
  archiveCta, deleteCta,
  description,
}: Props) {
  const [confirmInput, setConfirmInput] = useState('')
  const [busy, setBusy] = useState<'archive' | 'delete' | null>(null)

  useEffect(() => {
    if (!open) {
      setConfirmInput('')
      setBusy(null)
    }
  }, [open])

  const canDelete = confirmInput.trim() === entityName.trim() && busy === null
  const hasHighDeps = dependencies.some(d => d.severity === 'high' && d.count > 0)

  const handleAction = async (kind: 'archive' | 'delete', fn: () => Promise<void> | void) => {
    setBusy(kind)
    try {
      await fn()
      onOpenChange(false)
    } catch {
      // L'erreur a déjà été notifiée par le callback (toast côté DangerZone).
      // On garde le dialog ouvert pour permettre une nouvelle tentative.
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Supprimer {entityLabel}</DialogTitle>
          </div>
          <DialogDescription>
            {description ?? `Action irréversible. Tape le nom exact pour confirmer.`}
          </DialogDescription>
        </DialogHeader>

        {dependencies.length > 0 && (
          <div className={`rounded-md border p-3 text-sm ${hasHighDeps ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900'}`}>
            <p className="font-medium mb-1">
              {hasHighDeps ? '⚠️ Données légales liées' : 'Données liées qui seront supprimées'}
            </p>
            <ul className="space-y-0.5 text-xs">
              {dependencies.filter(d => d.count > 0).map(d => (
                <li key={d.label} className={d.severity === 'high' ? 'text-red-700 dark:text-red-300 font-medium' : ''}>
                  · {d.count} {d.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="td-confirm" className="text-sm">
            Tape <span className="font-mono font-semibold">{entityName}</span> pour confirmer
          </Label>
          <Input
            id="td-confirm"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={entityName}
            autoComplete="off"
            disabled={busy !== null}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy !== null}>
            Annuler
          </Button>
          {archiveCta && (
            <Button
              variant="outline"
              onClick={() => handleAction('archive', archiveCta.onConfirm)}
              disabled={busy !== null}
            >
              {busy === 'archive' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {archiveCta.label}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => handleAction('delete', deleteCta.onConfirm)}
            disabled={!canDelete}
          >
            {busy === 'delete' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deleteCta.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
