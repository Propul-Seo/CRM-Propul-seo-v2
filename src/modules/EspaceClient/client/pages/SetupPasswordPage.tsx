import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import '@/modules/EspaceClient/shared/layouts/portal-theme.css'

// Page atterrissage après clic sur le lien d'invitation Supabase Auth.
// Le client arrive ici avec une session déjà active (Supabase auto-login via
// hash) et doit définir son mot de passe pour pouvoir se reconnecter avec
// email + mot de passe ultérieurement.

const PASSWORD_MIN = 10

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

type GateState =
  | { kind: 'loading' }
  | { kind: 'no-session' }
  | { kind: 'internal-user'; email: string }
  | { kind: 'ok'; email: string }

export function SetupPasswordPage() {
  const navigate = useNavigate()
  const [gate, setGate] = useState<GateState>({ kind: 'loading' })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [form, setForm] = useState<FormState>({ kind: 'idle' })

  // Garde : il faut une session active ET l'email ne doit pas être celui d'un
  // user interne du CRM (public.users). Évite qu'un admin CRM qui atterrit
  // ici par erreur change son propre mot de passe sans avertissement.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        setGate({ kind: 'no-session' })
        return
      }
      const email = session.user.email ?? ''
      const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()
      if (cancelled) return
      if (internalUser) {
        setGate({ kind: 'internal-user', email })
        return
      }
      setGate({ kind: 'ok', email })
    })()
    return () => { cancelled = true }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < PASSWORD_MIN) {
      setForm({ kind: 'error', message: `Mot de passe trop court (min ${PASSWORD_MIN} caractères).` })
      return
    }
    if (password !== confirm) {
      setForm({ kind: 'error', message: 'Les deux mots de passe ne correspondent pas.' })
      return
    }
    setForm({ kind: 'submitting' })
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setForm({ kind: 'error', message: error.message })
      return
    }
    setForm({ kind: 'success' })
    setTimeout(() => navigate('/espace-client', { replace: true }), 1500)
  }

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
        <Button onClick={() => navigate('/espace-client/login')}>
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
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-[var(--ps-border)] p-6 space-y-4"
      >
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

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="pwd" className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
              Mot de passe <span className="text-[var(--ps-primary)]">*</span>
            </label>
            <Input
              id="pwd"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={form.kind === 'submitting' || form.kind === 'success'}
            />
            <p className="text-[11px] text-[var(--ps-fg-muted)]">
              Minimum {PASSWORD_MIN} caractères.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pwd-confirm" className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
              Confirmation <span className="text-[var(--ps-primary)]">*</span>
            </label>
            <Input
              id="pwd-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={form.kind === 'submitting' || form.kind === 'success'}
            />
          </div>

          {form.kind === 'error' && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{form.message}</span>
            </div>
          )}

          {form.kind === 'success' && (
            <div className="flex items-start gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-[12px] text-emerald-800">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Mot de passe enregistré. Redirection…</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={form.kind === 'submitting' || form.kind === 'success'}
        >
          {form.kind === 'submitting'
            ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Enregistrement…</>
            : 'Enregistrer et accéder à mon espace'}
        </Button>
      </form>
    </div>
  )
}
