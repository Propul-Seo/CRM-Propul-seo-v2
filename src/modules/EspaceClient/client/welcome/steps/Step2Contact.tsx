import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { User, Mail, Phone, Building2, Pencil, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext';
import type { UseWelcomeWizardResult, WelcomeField } from '../useWelcomeWizard';

function initials(name: string | null | undefined, fb = '?'): string {
  if (!name) return fb;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface EditableRowProps {
  icon: LucideIcon; label: string; value: string | null;
  placeholder: string; onChange: (v: string) => void; type?: 'text' | 'tel' | 'email';
}

function EditableRow({ icon: Icon, label, value, placeholder, onChange, type = 'text' }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    const t = draft.trim();
    if (t !== (value ?? '')) onChange(t);
    setEditing(false);
  };

  return (
    <div className="grid grid-cols-[26px_110px_1fr_24px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--ps-bg-subtle)]">
      <Icon className="h-4 w-4 text-[var(--ps-fg-muted)]" />
      <span className="text-[12.5px] text-[var(--ps-fg-secondary)]">{label}</span>
      {editing ? (
        <input
          ref={inputRef} type={type} value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); } }}
          placeholder={placeholder}
          className="w-full rounded-md border border-[var(--ps-primary)] bg-[var(--ps-bg-elevated)] px-2 py-1 text-[13.5px] font-semibold text-[var(--ps-fg)] outline-none ring-2 ring-[var(--ps-primary-subtle)]"
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)}
          className={cn(
            'text-left text-[13.5px] font-semibold tabular-nums',
            value ? 'text-[var(--ps-fg)]' : 'italic text-[var(--ps-fg-muted)] hover:text-[var(--ps-primary)]',
          )}
        >
          {value || `+ ${placeholder}`}
        </button>
      )}
      <button type="button" onClick={() => setEditing(true)} aria-label={`Modifier ${label.toLowerCase()}`}
        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--ps-fg-muted)] hover:bg-[var(--ps-primary-subtle)] hover:text-[var(--ps-primary-text)]"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ReadOnlyRow({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="grid grid-cols-[26px_110px_1fr_24px] items-center gap-3 px-4 py-2.5" aria-describedby="email-readonly-hint">
      <Icon className="h-4 w-4 text-[var(--ps-fg-muted)]" />
      <span className="text-[12.5px] text-[var(--ps-fg-secondary)]">{label}</span>
      <span className="flex min-w-0 items-center gap-2 truncate text-[13.5px] font-semibold tabular-nums text-[var(--ps-fg)]">
        <span className="truncate">{value}</span>
        {hint && (
          <span className="shrink-0 rounded-full bg-[var(--ps-bg-subtle)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--ps-fg-muted)] ring-1 ring-[var(--ps-border)]">
            {hint}
          </span>
        )}
      </span>
      <Lock className="h-3.5 w-3.5 text-[var(--ps-fg-muted)]" />
    </div>
  );
}

interface Step2ContactProps { wizard: UseWelcomeWizardResult }

export function Step2Contact({ wizard }: Step2ContactProps) {
  const { email, project } = usePortal();
  const { row, setField } = wizard;

  const firstName = row?.welcome_first_name ?? '';
  const lastName  = row?.welcome_last_name ?? '';
  const phone     = row?.welcome_phone ?? '';
  const company   = row?.welcome_company ?? project.name ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || project.client_name || 'Votre profil';

  const handleSet = <K extends keyof WelcomeField>(key: K) => (value: string) => {
    setField(key, (value || null) as WelcomeField[K]);
  };

  return (
    <div className="mx-auto w-full max-w-[600px] space-y-3">
      <div className="overflow-hidden rounded-3xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] shadow-[var(--ps-shadow-floating)]">
        <div className="ps-brand-gradient h-[2px]" />

        <div className="flex items-center gap-3 bg-[var(--ps-bg-subtle)] px-5 py-3">
          <div className="ps-brand-gradient ps-glow-violet-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tracking-wider text-white">
            {initials(fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[var(--ps-fg)]">{fullName}</p>
            {company && <p className="truncate text-[12.5px] text-[var(--ps-fg-muted)]">{company}</p>}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ps-success-subtle)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--ps-success-text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-success)]" aria-hidden />Pré-rempli
          </span>
        </div>

        <div className="divide-y divide-[var(--ps-border-soft)]">
          <EditableRow icon={User} label="Prénom" value={firstName} placeholder="Votre prénom" onChange={handleSet('welcome_first_name')} />
          <EditableRow icon={User} label="Nom" value={lastName} placeholder="Votre nom" onChange={handleSet('welcome_last_name')} />
          <ReadOnlyRow icon={Mail} label="Email" value={email} hint="Login" />
          <EditableRow icon={Phone} label="Téléphone" value={phone} placeholder="06 12 34 56 78" type="tel" onChange={handleSet('welcome_phone')} />
          <EditableRow icon={Building2} label="Société" value={company} placeholder="Nom de votre société" onChange={handleSet('welcome_company')} />
        </div>
      </div>

      <p id="email-readonly-hint" className="px-1 text-[11.5px] text-[var(--ps-fg-secondary)]">
        Email non modifiable — c'est votre identifiant de connexion. Pour le changer, contactez votre AE.
      </p>
    </div>
  );
}
