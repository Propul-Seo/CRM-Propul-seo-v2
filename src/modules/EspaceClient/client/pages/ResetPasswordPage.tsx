import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { portalSupabase as supabase } from '@/lib/supabase'
import { PasswordSetForm } from '@/modules/EspaceClient/shared/components'
import { portalBase } from '@/modules/EspaceClient/shared/portalHost'
import '@/modules/EspaceClient/shared/layouts/portal-theme.css'

// Sprint A.2b — page de réinitialisation du mot de passe.
// Atterrissage après clic sur le lien envoyé par requestPasswordReset().
// Supabase auto-login l'utilisateur via le recovery token dans le hash URL,
// donc une session est active à l'arrivée. On affiche le form de nouveau mdp
// puis on déconnecte et on redirige vers /login (cf décision A.2b : reset
// → login avec toast de confirmation, pas auto-redirect espace-client).

type GateState =
  | { kind: 'loading' }
  | { kind: 'no-session' }
  | { kind: 'internal-user'; email: string }
  | { kind: 'ok'; email: string }

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [gate, setGate] = useState<GateState>({ kind: 'loading' })

  // Code review H-1 : sur mobile / nav lent, getSession() peut tirer avant que
  // Supabase ait parsé le hash recovery → faux "no-session". On combine donc
  // getSession() (cas warm cache) + onAuthStateChange (cas hash recovery) +
  // timeout de fallback 8s.
  useEffect(() => {
    let cancelled = false
    let resolved = false

    async function evaluate(session: { user: { id: string; email: string | null } } | null) {
      if (cancelled || resolved) return
      if (!session) return // attend un autre event
      resolved = true
      const email = session.user.email ?? ''
      const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()
      if (cancelled) return
      setGate(internalUser ? { kind: 'internal-user', email } : { kind: 'ok', email })
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      void evaluate(session)
    })

    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) void evaluate(session)
    })()

    const timeout = setTimeout(() => {
      if (!cancelled && !resolved) {
        resolved = true
        setGate({ kind: 'no-session' })
      }
    }, 8000)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      sub.subscription.unsubscribe()
    }
  }, [])

  // Code review H-2 + M-1 :
  // - signOut IMMÉDIATEMENT après updateUser pour fermer la fenêtre de session
  //   zombie (avant : 1500ms de session recovery active).
  // - Toast côté login déclenché via sessionStorage (éphémère, non forgeable
  //   via URL) au lieu de ?reset=success.
  // Le délai 1500ms reste sur le navigate uniquement pour laisser l'utilisateur
  // voir le message de succès.
  async function handleSuccess() {
    try {
      sessionStorage.setItem('propulspace_reset_success', '1')
    } catch { /* ignore */ }
    await supabase.auth.signOut()
    setTimeout(() => {
      navigate(`${portalBase()}/login`, { replace: true })
    }, 1500)
  }

  if (gate.kind === 'loading') {
    return (
      <div className="propulspace-portal ps-theme-nightmin-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--ps-primary)]" />
      </div>
    )
  }

  if (gate.kind === 'no-session') {
    return (
      <div className="propulspace-portal ps-theme-nightmin-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-12 w-12 text-[var(--ps-warning)] mb-3" />
        <h1 className="text-lg font-semibold mb-2">Lien expiré ou invalide</h1>
        <p className="text-sm text-[var(--ps-fg-muted)] mb-5 max-w-sm">
          Le lien de réinitialisation a expiré ou a déjà été utilisé. Demandez
          un nouveau lien depuis la page de connexion.
        </p>
        <Button onClick={() => navigate(`${portalBase()}/login`)}>
          Aller à la page de connexion
        </Button>
      </div>
    )
  }

  if (gate.kind === 'internal-user') {
    return (
      <div className="propulspace-portal ps-theme-nightmin-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-12 w-12 text-[var(--ps-danger)] mb-3" />
        <h1 className="text-lg font-semibold mb-2">Page réservée aux clients externes</h1>
        <p className="text-sm text-[var(--ps-fg-muted)] mb-5 max-w-sm">
          Vous êtes connecté en tant que <strong>{gate.email}</strong> (compte
          interne de l'agence). Cette page est réservée aux clients du portail.
        </p>
      </div>
    )
  }

  return (
    <div className="propulspace-portal ps-theme-nightmin-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-[var(--ps-bg-elevated)] rounded-lg shadow-sm border border-[var(--ps-border)] p-6 space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)] flex items-center justify-center mb-3">
            <KeyRound className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h1 className="text-lg font-semibold text-[var(--ps-fg)]">
            Réinitialiser votre mot de passe
          </h1>
          <p className="text-[12.5px] text-[var(--ps-fg-muted)] mt-1">
            Connecté en tant que <strong>{gate.email}</strong>. Choisissez un
            nouveau mot de passe. Vous serez redirigé vers la page de connexion.
          </p>
        </div>

        <PasswordSetForm
          submitLabel="Réinitialiser et me reconnecter"
          successMessage="Mot de passe modifié. Redirection vers la connexion…"
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
