import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { portalSupabase as supabase } from '@/lib/supabase'
import { PasswordSetForm } from '@/modules/EspaceClient/shared/components'
import { portalBase, portalRoot } from '@/modules/EspaceClient/shared/portalHost'
import '@/modules/EspaceClient/shared/layouts/portal-theme.css'

// Page atterrissage après clic sur le lien d'invitation Supabase Auth.
// Le client arrive ici avec une session déjà active (Supabase auto-login via
// hash) et doit définir son mot de passe pour pouvoir se reconnecter avec
// email + mot de passe ultérieurement.

type GateState =
  | { kind: 'loading' }
  | { kind: 'no-session' }
  | { kind: 'internal-user'; email: string }
  | { kind: 'ok'; email: string }

export function SetupPasswordPage() {
  const navigate = useNavigate()
  const [gate, setGate] = useState<GateState>({ kind: 'loading' })

  // Code review H-1 : sur mobile / nav lent, getSession() peut tirer avant que
  // Supabase ait parsé le hash invitation (event SIGNED_IN) → faux "no-session".
  // On combine getSession() + onAuthStateChange + timeout 8s.
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

  if (gate.kind === 'loading') {
    return (
      <div className="propulspace-portal min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    )
  }

  if (gate.kind === 'no-session') {
    return (
      <div className="propulspace-portal min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-3" />
        <h1 className="text-lg font-semibold mb-2">Lien expiré ou invalide</h1>
        <p className="text-sm text-[var(--ps-fg-muted)] mb-5 max-w-sm">
          Le lien d'invitation a expiré ou a déjà été utilisé. Demandez à votre
          agence de vous renvoyer un nouveau lien d'accès.
        </p>
        <Button onClick={() => navigate(`${portalBase()}/login`)}>
          Aller à la page de connexion
        </Button>
      </div>
    )
  }

  if (gate.kind === 'internal-user') {
    return (
      <div className="propulspace-portal min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h1 className="text-lg font-semibold mb-2">Page réservée aux clients externes</h1>
        <p className="text-sm text-[var(--ps-fg-muted)] mb-5 max-w-sm">
          Vous êtes connecté en tant que <strong>{gate.email}</strong> (compte
          interne de l'agence). Cette page est réservée aux clients du portail.
          Pour changer votre mot de passe interne, utilisez les paramètres du CRM.
        </p>
      </div>
    )
  }

  return (
    <div className="propulspace-portal min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-[var(--ps-border)] p-6 space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center mb-3">
            <Lock className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h1 className="text-lg font-semibold text-[var(--ps-fg)]">
            Créez votre mot de passe
          </h1>
          <p className="text-[12.5px] text-[var(--ps-fg-muted)] mt-1">
            Connecté en tant que <strong>{gate.email}</strong>. Vous pourrez
            ensuite vous reconnecter avec votre email et ce mot de passe.
          </p>
        </div>

        <PasswordSetForm
          submitLabel="Enregistrer et accéder à mon espace"
          successMessage="Mot de passe enregistré. Redirection…"
          onSuccess={() => setTimeout(() => navigate(portalRoot(), { replace: true }), 1500)}
        />
      </div>
    </div>
  )
}
