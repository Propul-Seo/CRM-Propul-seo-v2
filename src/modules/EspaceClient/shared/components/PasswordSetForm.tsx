import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { portalSupabase as supabase } from '@/lib/supabase';

// Composant partagé pour la définition d'un mot de passe portail :
// - utilisé par SetupPasswordPage (1re fois après invitation)
// - utilisé par ResetPasswordPage (suite à un lien recovery)
// Suppose qu'une session Supabase est active (le caller fait le gating
// session/identité avant de rendre ce composant).

export const PORTAL_PASSWORD_MIN = 8;

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

interface PasswordSetFormProps {
  submitLabel: string;          // ex. "Enregistrer et accéder à mon espace"
  successMessage: string;       // ex. "Mot de passe enregistré. Redirection…"
  onSuccess: () => void;        // callback appelé après updateUser réussi
  disabled?: boolean;
}

export function PasswordSetForm({ submitLabel, successMessage, onSuccess, disabled }: PasswordSetFormProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [form, setForm] = useState<FormState>({ kind: 'idle' });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < PORTAL_PASSWORD_MIN) {
      setForm({ kind: 'error', message: `Mot de passe trop court (min ${PORTAL_PASSWORD_MIN} caractères).` });
      return;
    }
    if (password !== confirm) {
      setForm({ kind: 'error', message: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setForm({ kind: 'submitting' });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setForm({ kind: 'error', message: error.message });
      return;
    }
    setForm({ kind: 'success' });
    onSuccess();
  }

  const locked = disabled || form.kind === 'submitting' || form.kind === 'success';

  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
          disabled={locked}
        />
        <p className="text-[11px] text-[var(--ps-fg-muted)]">
          Minimum {PORTAL_PASSWORD_MIN} caractères.
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
          disabled={locked}
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
          <span>{successMessage}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={locked}>
        {form.kind === 'submitting'
          ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Enregistrement…</>
          : submitLabel}
      </Button>
    </form>
  );
}
