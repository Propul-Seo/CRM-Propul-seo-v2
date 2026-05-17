import { useEffect, useState } from 'react'
import { Sparkles, Loader2, AlertCircle, Info } from 'lucide-react'
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ActivatePortalPayload {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  defaultEmail?: string | null
  defaultEmailHint?: string
  onConfirm: (payload: ActivatePortalPayload) => Promise<{ success: boolean; error?: string }>
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Dialog d'activation du portail. Email pré-rempli depuis le contact principal,
// checkbox de confirmation obligatoire (anti-erreur), bouton désactivé tant que
// l'email n'est pas valide ET que la checkbox n'est pas cochée.
export function ActivatePortalDialog({
  open,
  onOpenChange,
  projectName,
  defaultEmail,
  defaultEmailHint,
  onConfirm,
}: Props) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail ?? '')
      setFirstName('')
      setLastName('')
      setPhone('')
      setConfirmed(false)
      setSubmitting(false)
      setError(null)
    }
  }, [open, defaultEmail])

  const cleanedEmail = email.trim().toLowerCase()
  const emailValid = EMAIL_REGEX.test(cleanedEmail)
  const canConfirm = emailValid && confirmed && !submitting

  async function handleConfirm() {
    if (!canConfirm) return
    setSubmitting(true)
    setError(null)
    const result = await onConfirm({
      email: cleanedEmail,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    })
    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Erreur inconnue')
      return
    }
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <AlertDialogContent className="propulspace-portal max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-700">
            <Sparkles className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <AlertDialogTitle className="text-center">
            Activer le portail client
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Le client recevra un email d'invitation pour créer son mot de passe
            et accéder à l'espace projet « {projectName} ».
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="portal-email" className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
              Email du client <span className="text-[var(--ps-primary)]">*</span>
            </label>
            <Input
              id="portal-email"
              type="email"
              autoComplete="off"
              placeholder="ex: sophie@precieuse-joaillerie.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            {defaultEmailHint && (
              <p className="flex items-start gap-1.5 text-[11px] text-[var(--ps-fg-muted)]">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {defaultEmailHint}
              </p>
            )}
            {email && !emailValid && (
              <p className="text-[11px] text-red-600">Format email invalide.</p>
            )}
          </div>

          <div className="rounded-md border border-[var(--ps-border)] p-3 space-y-2.5">
            <p className="text-[11px] text-[var(--ps-fg-muted)]">
              Informations contact <span className="italic">(optionnel — crée un contact lié au projet)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="portal-firstname" className="text-[11.5px] font-medium text-[var(--ps-fg)]">
                  Prénom
                </label>
                <Input
                  id="portal-firstname"
                  autoComplete="off"
                  placeholder="Sophie"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="portal-lastname" className="text-[11.5px] font-medium text-[var(--ps-fg)]">
                  Nom
                </label>
                <Input
                  id="portal-lastname"
                  autoComplete="off"
                  placeholder="Martin"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="portal-phone" className="text-[11.5px] font-medium text-[var(--ps-fg)]">
                Téléphone
              </label>
              <Input
                id="portal-phone"
                type="tel"
                autoComplete="off"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 accent-violet-600"
            />
            <span className="text-[12px] text-[var(--ps-fg)]">
              J'ai vérifié cet email avec le client.
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {submitting ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Activation…</>
            ) : (
              <><Sparkles className="mr-1.5 h-4 w-4" />Activer le portail</>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
