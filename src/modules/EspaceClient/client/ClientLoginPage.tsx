import { useState, type FormEvent } from 'react';
import { Mail, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandPill, StatusPage } from '@/modules/EspaceClient/shared/components';
import { usePortalAuth } from '@/modules/EspaceClient/shared/hooks/usePortalAuth';
import { AGENCY_NAME } from '@/modules/EspaceClient/shared/constants';
import '@/modules/EspaceClient/shared/layouts/portal-theme.css';

type FormState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string };

export function ClientLoginPage() {
  const { signInWithMagicLink } = usePortalAuth();
  const [email, setEmail] = useState('');
  const [form, setForm] = useState<FormState>({ kind: 'idle' });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setForm({ kind: 'sending' });
    const { error } = await signInWithMagicLink(trimmed);
    if (error) {
      setForm({ kind: 'error', message: error });
      return;
    }
    setForm({ kind: 'sent', email: trimmed });
  }

  if (form.kind === 'sent') {
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

  return (
    <div className="propulspace-portal flex min-h-screen items-center justify-center px-6 py-16">
      <div className="ps-surface relative w-full max-w-[420px] overflow-hidden p-8">
        <div
          aria-hidden
          className="ps-hero-glow pointer-events-none absolute -top-32 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        />
        <div className="relative">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <BrandPill size="lg" />
            <p className="ps-eyebrow ps-eyebrow-muted">Espace client</p>
            <h1 className="ps-gradient-text text-[26px] font-bold leading-tight tracking-tight">
              Connexion sécurisée
            </h1>
            <p className="max-w-[300px] text-[13.5px] leading-relaxed text-[var(--ps-fg-secondary)]">
              Entrez votre email professionnel. {AGENCY_NAME} vous enverra un lien de connexion à usage unique.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label htmlFor="portal-login-email" className="sr-only">Adresse email</label>
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
                  disabled={form.kind === 'sending'}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={form.kind === 'sending' || !email.trim()}
              className="ps-brand-gradient h-11 w-full text-white disabled:opacity-60"
            >
              {form.kind === 'sending' ? (
                <>Envoi en cours…</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Recevoir le lien de connexion
                </>
              )}
            </Button>

            {form.kind === 'error' && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                {form.message}
              </p>
            )}
          </form>

          <p className="mt-5 text-center text-[11.5px] text-[var(--ps-fg-muted)]">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
}
