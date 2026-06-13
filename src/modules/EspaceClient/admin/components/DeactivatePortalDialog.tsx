import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, AlertCircle } from 'lucide-react'
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAdminPortalScope } from '@/modules/EspaceClient/admin/AdminBasePathContext'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  clientEmail: string
  onConfirm: (reason?: string) => Promise<{ success: boolean; error?: string }>
}

// Dialog de désactivation avec confirmation typée (nom du projet à recopier).
// Champ raison optionnel (500 caractères max). Session client expire au prochain
// refresh car portal_project_id() retourne NULL.
export function DeactivatePortalDialog({
  open,
  onOpenChange,
  projectName,
  clientEmail,
  onConfirm,
}: Props) {
  const portalScope = useAdminPortalScope()
  const [typedName, setTypedName] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTypedName('')
      setReason('')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const nameMatches = typedName.trim() === projectName.trim()
  const canConfirm = nameMatches && !submitting

  async function handleConfirm() {
    if (!canConfirm) return
    setSubmitting(true)
    setError(null)
    const result = await onConfirm(reason.trim() || undefined)
    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Erreur inconnue')
      return
    }
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <AlertDialogContent className={cn(portalScope, 'max-w-md')}>
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
            <AlertTriangle className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <AlertDialogTitle className="text-center">
            Désactiver le portail ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <strong>{clientEmail}</strong> perdra l'accès à l'espace projet
            « {projectName} » au prochain rafraîchissement de sa session.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="confirm-name" className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
              Pour confirmer, recopiez le nom du projet : <strong>{projectName}</strong>
            </label>
            <Input
              id="confirm-name"
              autoComplete="off"
              placeholder={projectName}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="deact-reason" className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
              Raison <span className="text-[var(--ps-fg-muted)] font-normal">(optionnel)</span>
            </label>
            <Textarea
              id="deact-reason"
              rows={2}
              placeholder="Ex : Projet livré, client a changé d'email, désaccord commercial…"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              disabled={submitting}
            />
            <p className="text-[10px] text-[var(--ps-fg-muted)] text-right">{reason.length}/500</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-[12px] text-red-300">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
            {submitting ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Désactivation…</>
            ) : (
              'Désactiver'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
