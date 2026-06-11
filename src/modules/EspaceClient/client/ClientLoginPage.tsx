import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Send, LogIn, CheckCircle2, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandPill, StatusPage } from '@/modules/EspaceClient/shared/components';
import { usePortalAuth } from '@/modules/EspaceClient/shared/hooks/usePortalAuth';
import { AGENCY_NAME } from '@/modules/EspaceClient/shared/constants';
import { portalRoot } from '@/modules/EspaceClient/shared/portalHost';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

// Sprint A.2b — refonte complète.
// Mode principal : email + mot de passe (post-SetupPasswordPage).
// Toggle "Recevoir un lien à la place" → magic link (fallback).
// Lien "Mot de passe oublié ?" → écran dédié qui envoie un email reset.
// Toast "Mot de passe modifié" si la page reçoit ?reset=success.

type Mode = 'password' | 'magic-link' | 'forgot';

type FormState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent-magic'; email: string }
  | { kind: 'sent-reset'; email: string }
  | { kind: 'error'; message: string };

// Mapping des messages Supabase Auth vers du français lisible.
function humanizeAuthError(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return 'Email ou mot de passe incorrect.';
  if (/email not confirmed/i.test(raw)) return 'Adresse email non confirmée.';
  if (/rate limit/i.test(raw)) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (/user not found/i.test(raw)) return 'Aucun compte associé à cet email.';
  return raw;
}

export function ClientLoginPage() {
  const navigate = useNavigate();
  const { state, signInWithPassword, signInWithMagicLink, requestPasswordReset } = usePortalAuth();
  const [mode, setMode] = useState<Mode>('password');

  // Redirection réactive : uniquement si la session correspond à un client portail
  // ('ready' = email matché à projects_v2.portal_client_email). On NE redirige PAS
  // sur 'no-project' : ce cas couvre les admins connectés (session CRM) qui
  // arriveraient sur /espace-client/login — il faut leur laisser la page de login
  // accessible pour qu'ils puissent se reconnecter avec un email client.
  useEffect(() => {
    if (state.status === 'ready') {
      navigate(portalRoot(), { replace: true });
    }
  }, [state.status, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState<FormState>({ kind: 'idle' });
  // Code review M-1 : flag éphémère sessionStorage (consommé une seule fois,
  // non forgeable via URL — l'ancienne version utilisait ?reset=success en
  // query param, vulnérable au phishing social).
  // Note React 18 : lecture/suppression dans un useEffect, pas dans l'initializer
  // de useState, car StrictMode dev invoke l'initializer deux fois → la 2e
  // lecture trouve la clé déjà supprimée.
  const [resetToast, setResetToast] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('propulspace_reset_success') === '1') {
        sessionStorage.removeItem('propulspace_reset_success');
        setResetToast(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-hide du toast après 6s pour éviter de polluer la page.
  useEffect(() => {
    if (!resetToast) return;
    const t = setTimeout(() => setResetToast(false), 6000);
    return () => clearTimeout(t);
  }, [resetToast]);

  async function onSubmitPassword(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) return;
    setForm({ kind: 'sending' });
    const { error } = await signInWithPassword(trimmed, password);
    if (error) {
      setForm({ kind: 'error', message: humanizeAuthError(error) });
      return;
    }
    // Succès : le useEffect ci-dessus surveille state.status === 'ready' et
    // redirige vers /espace-client. PortalGuard prend ensuite le relais.
    setForm({ kind: 'idle' });
  }

  // Dev only — connexion démo en un clic (jamais inclus dans le build prod).
  // Compte préparé via scripts/setup-demo-portal.mjs (projet Boulangerie Dupont).
  const DEMO_EMAIL = 'lyestriki@gmail.com';
  const DEMO_PASSWORD = 'Demo1234!';
  async function onDemoLogin() {
    setForm({ kind: 'sending' });
    const { error } = await signInWithPassword(DEMO_EMAIL, DEMO_PASSWORD);
    if (error) {
      setForm({ kind: 'error', message: humanizeAuthError(error) });
      return;
    }
    setForm({ kind: 'idle' });
  }

  async function onSubmitMagicLink(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setForm({ kind: 'sending' });
    const { error } = await signInWithMagicLink(trimmed);
    if (error) {
      setForm({ kind: 'error', message: humanizeAuthError(error) });
      return;
    }
    setForm({ kind: 'sent-magic', email: trimmed });
  }

  async function onSubmitForgot(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setForm({ kind: 'sending' });
    const { error } = await requestPasswordReset(trimmed);
    // Code review C-1 : pour éviter l'user enumeration, on affiche TOUJOURS le
    // même écran de succès neutre, sauf si rate-limit Supabase (visible côté UX
    // pour ne pas paraître cassé). Le serveur n'envoie pas d'email si l'email
    // est inconnu → côté client on dit "si cet email existe, vous recevrez un lien".
    if (error && /rate limit/i.test(error)) {
      setForm({ kind: 'error', message: humanizeAuthError(error) });
      return;
    }
    setForm({ kind: 'sent-reset', email: trimmed });
  }

  // États de confirmation (magic link envoyé ou reset envoyé) : page dédiée.
  if (form.kind === 'sent-magic') {
    return (
      <div className="propulspace-portal min-h-screen">
        <StatusPage
          icon={CheckCircle2}
          tone="green"
          title="Email envoyé"
          subtitle={`Un lien de connexion vient d'être envoyé à ${form.email}. Cliquez dessus pour accéder à votre espace.`}
          footnote="Pensez à vérifier vos spams. Le lien expire dans 1 heure."
        />
      </div>
    );
  }

  if (form.kind === 'sent-reset') {
    // Message neutre (cf code review C-1) : on ne confirme pas l'existence du compte.
    return (
      <div className="propulspace-portal min-h-screen">
        <StatusPage
          icon={CheckCircle2}
          tone="green"
          title="Vérifiez votre boîte mail"
          subtitle={`Si un compte est associé à ${form.email}, un lien de réinitialisation vient d'y être envoyé.`}
          footnote="Pensez à vérifier vos spams. Le lien expire dans 1 heure."
        />
      </div>
    );
  }

  const submitting = form.kind === 'sending';

  return (
    <div className="propulspace-portal flex min-h-screen items-center justify-center px-6 py-16">
      <div className="ps-surface relative w-full max-w-[420px] overflow-hidden p-8">
        <div
          aria-hidden
          className="ps-hero-glow pointer-events-none absolute -top-32 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        />
        <div className="relative">
          {/* Toast confirmation reset password réussi */}
          {resetToast && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Mot de passe modifié avec succès. Connectez-vous avec votre nouveau mot de passe.</span>
            </div>
          )}

          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <BrandPill size="lg" />
            <p className="ps-eyebrow ps-eyebrow-muted">Espace client</p>
            <h1 className="ps-gradient-text text-[26px] font-bold leading-tight tracking-tight">
              {mode === 'forgot' ? 'Mot de passe oublié' : 'Connexion sécurisée'}
            </h1>
            <p className="max-w-[300px] text-[13.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
              {mode === 'password'  && `Connectez-vous à votre espace ${AGENCY_NAME} avec votre email et mot de passe.`}
              {mode === 'magic-link' && `Recevez un lien de connexion à usage unique sur votre email.`}
              {mode === 'forgot'     && `Entrez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.`}
            </p>
          </div>

          {/* MODE PASSWORD — login email + mdp */}
          {mode === 'password' && (
            <form onSubmit={onSubmitPassword} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
                <Input
                  id="portal-login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="vous@entreprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={submitting}
                  className="h-11 pl-9"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
                <Input
                  id="portal-login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={submitting}
                  className="h-11 pl-9"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || !email.trim() || !password}
                className="ps-brand-gradient h-11 w-full text-white disabled:opacity-60"
              >
                {submitting ? <>Connexion en cours…</> : <><LogIn className="mr-2 h-4 w-4" />Se connecter</>}
              </Button>

              {form.kind === 'error' && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                  {form.message}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 text-[12px]">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setForm({ kind: 'idle' }); setPassword(''); }}
                  className="text-[var(--ps-primary-text)] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('magic-link'); setForm({ kind: 'idle' }); setPassword(''); }}
                  className="text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)] hover:underline"
                >
                  Recevoir un lien à la place
                </button>
              </div>

              {/* Dev only — accès démo direct (retiré du build prod) */}
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={onDemoLogin}
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--ps-fg-muted)]/40 px-3 py-2 text-[12px] text-[var(--ps-fg-muted)] transition hover:bg-black/5 disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Connexion démo (Boulangerie Dupont)
                </button>
              )}
            </form>
          )}

          {/* MODE MAGIC LINK */}
          {mode === 'magic-link' && (
            <form onSubmit={onSubmitMagicLink} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="vous@entreprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={submitting}
                  className="h-11 pl-9"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || !email.trim()}
                className="ps-brand-gradient h-11 w-full text-white disabled:opacity-60"
              >
                {submitting ? <>Envoi en cours…</> : <><Send className="mr-2 h-4 w-4" />Recevoir le lien de connexion</>}
              </Button>

              {form.kind === 'error' && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                  {form.message}
                </p>
              )}

              <button
                type="button"
                onClick={() => { setMode('password'); setForm({ kind: 'idle' }); }}
                className="flex w-full items-center justify-center gap-1.5 pt-1 text-[12px] text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Connexion par mot de passe
              </button>
            </form>
          )}

          {/* MODE FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={onSubmitForgot} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="vous@entreprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={submitting}
                  className="h-11 pl-9"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || !email.trim()}
                className="ps-brand-gradient h-11 w-full text-white disabled:opacity-60"
              >
                {submitting ? <>Envoi en cours…</> : <><KeyRound className="mr-2 h-4 w-4" />Envoyer le lien de réinitialisation</>}
              </Button>

              {form.kind === 'error' && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                  {form.message}
                </p>
              )}

              <button
                type="button"
                onClick={() => { setMode('password'); setForm({ kind: 'idle' }); }}
                className="flex w-full items-center justify-center gap-1.5 pt-1 text-[12px] text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour à la connexion
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-[11.5px] text-[var(--ps-fg-muted)]">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
}
