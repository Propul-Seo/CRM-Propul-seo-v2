import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { User, Mail, Phone, Building2, Pencil, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { UseWelcomeWizardResult, WelcomeField } from '../useWelcomeWizard';

function initials(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Ligne éditable : clic sur la valeur (ou sur Pencil) → input inline.
// blur ou Enter → on rappelle setField (autosave debounce côté hook).
// Echap → annule l'édition.
interface EditableRowProps {
  icon: LucideIcon;
  label: string;
  value: string | null;
  placeholder: string;
  onChange: (value: string) => void;
  type?: 'text' | 'tel' | 'email';
}

function EditableRow({ icon: Icon, label, value, placeholder, onChange, type = 'text' }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== (value ?? '')) onChange(trimmed);
    setEditing(false);
  };

  return (
    <div className="grid grid-cols-[26px_110px_1fr_24px] items-center gap-3 px-4 py-3 hover:bg-[var(--ps-bg-subtle)]/50">
      <Icon className="h-4 w-4 text-[var(--ps-fg-muted)]" />
      <span className="text-[12.5px] text-[var(--ps-fg-muted)]">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); }
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-[var(--ps-primary)] bg-white px-2 py-1 text-[13.5px] font-semibold text-[var(--ps-fg)] outline-none focus:ring-2 focus:ring-[var(--ps-primary)]/30"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            'text-left text-[13.5px] font-semibold tabular-nums',
            value ? 'text-[var(--ps-fg)]' : 'text-[var(--ps-fg-muted)] italic',
          )}
        >
          {value || placeholder}
        </button>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Modifier ${label.toLowerCase()}`}
        className="text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)]"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Ligne en lecture seule (email = identifiant de connexion).
function ReadOnlyRow({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div
      className="grid grid-cols-[26px_110px_1fr_24px] items-center gap-3 px-4 py-3"
      aria-readonly="true"
      aria-describedby="email-readonly-hint"
    >
      <Icon className="h-4 w-4 text-[var(--ps-fg-muted)]" />
      <span className="text-[12.5px] text-[var(--ps-fg-muted)]">{label}</span>
      <span className="truncate text-[13.5px] font-semibold tabular-nums text-[var(--ps-fg)]">
        {value}
        {hint && <span className="ml-1.5 text-[11.5px] font-normal text-[var(--ps-fg-muted)]">{hint}</span>}
      </span>
      <Lock className="h-3.5 w-3.5 text-[var(--ps-fg-muted)]" />
    </div>
  );
}

interface Step2ContactProps {
  wizard: UseWelcomeWizardResult;
}

export function Step2Contact({ wizard }: Step2ContactProps) {
  const { email, project } = usePortal();
  const { row, setField } = wizard;

  const firstName = row?.welcome_first_name ?? '';
  const lastName  = row?.welcome_last_name ?? '';
  const phone     = row?.welcome_phone ?? '';
  const company   = row?.welcome_company ?? project.name ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || project.client_name || 'Votre profil';

  const handleSet = <K extends keyof WelcomeField>(key: K) => (value: string) => {
    // text = null si vide pour ne pas stocker des chaînes vides en DB
    setField(key, (value || null) as WelcomeField[K]);
  };

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <div className="rounded-2xl border border-[var(--ps-border)] bg-white shadow-sm">
        {/* Header carte */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-gradient-to-br from-[var(--ps-primary-subtle)] to-white px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-primary-deep)] text-[14px] font-bold text-white">
            {initials(fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[var(--ps-fg)]">{fullName}</p>
            {company && (
              <p className="truncate text-[12.5px] text-[var(--ps-fg-muted)]">{company}</p>
            )}
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Pré-rempli
          </span>
        </div>

        {/* Lignes éditables */}
        <div className="divide-y divide-[var(--ps-border-soft)]">
          <EditableRow icon={User} label="Prénom" value={firstName} placeholder="Votre prénom"
            onChange={handleSet('welcome_first_name')} />
          <EditableRow icon={User} label="Nom" value={lastName} placeholder="Votre nom"
            onChange={handleSet('welcome_last_name')} />
          <ReadOnlyRow icon={Mail} label="Email" value={email} hint="· Login" />
          <EditableRow icon={Phone} label="Téléphone" value={phone} placeholder="06 12 34 56 78"
            type="tel" onChange={handleSet('welcome_phone')} />
          <EditableRow icon={Building2} label="Société" value={company} placeholder="Nom de votre société"
            onChange={handleSet('welcome_company')} />
        </div>
      </div>

      <p id="email-readonly-hint" className="px-1 text-[12px] text-[var(--ps-fg-muted)]">
        Email non modifiable — c'est votre identifiant de connexion. Pour le changer, contactez votre AE.
      </p>
    </div>
  );
}
