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

// Wrapper de rangée : ajoute la barre violette qui glisse au survol + ps-tap.
const rowBase =
  'group/row relative grid grid-cols-[26px_110px_1fr_24px] items-center gap-3 px-4 py-3 ' +
  'transition-colors duration-[var(--ps-dur-fast)] hover:bg-[var(--ps-bg-subtle)]/50 ' +
  "before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[2px] " +
  'before:-translate-y-1/2 before:scale-y-0 before:rounded-r-full before:bg-[var(--ps-primary)] ' +
  'before:transition-transform before:duration-[var(--ps-dur-base)] before:origin-center ' +
  'hover:before:scale-y-100';

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
    <div className={cn(rowBase, 'ps-tap', editing && 'bg-[var(--ps-primary-subtle)]/20')}>
      <Icon className="h-4 w-4 text-[var(--ps-fg-muted)] transition-colors group-hover/row:text-[var(--ps-primary)]" />
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
          className="w-full rounded-md border border-[var(--ps-primary)] bg-white px-2 py-1 text-[13.5px] font-semibold text-[var(--ps-fg)] outline-none ring-2 ring-[var(--ps-primary)]/20 transition-all duration-[var(--ps-dur-base)] focus:ring-[var(--ps-primary)]/35"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            'text-left text-[13.5px] font-semibold ps-num transition-colors',
            value
              ? 'text-[var(--ps-fg)]'
              : 'text-[var(--ps-fg-muted)] underline decoration-dashed decoration-[var(--ps-border)] underline-offset-4 hover:decoration-[var(--ps-primary)] hover:text-[var(--ps-primary)]',
          )}
        >
          {value || `+ ${placeholder}`}
        </button>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Modifier ${label.toLowerCase()}`}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md text-[var(--ps-fg-muted)] opacity-0',
          'transition-all duration-[var(--ps-dur-fast)] group-hover/row:opacity-100',
          'hover:scale-110 hover:bg-[var(--ps-primary-subtle)] hover:text-[var(--ps-primary)]',
        )}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ReadOnlyRow({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div
      className="group/row relative grid grid-cols-[26px_110px_1fr_24px] items-center gap-3 px-4 py-3"
      aria-describedby="email-readonly-hint"
    >
      <Icon className="h-4 w-4 text-[var(--ps-fg-muted)]" />
      <span className="text-[12.5px] text-[var(--ps-fg-muted)]">{label}</span>
      <span className="flex min-w-0 items-center gap-2 truncate text-[13.5px] font-semibold ps-num text-[var(--ps-fg)]">
        <span className="truncate">{value}</span>
        {hint && (
          <span className="shrink-0 rounded-full bg-[var(--ps-bg-subtle)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--ps-fg-muted)] ring-1 ring-[var(--ps-border-soft)]">
            {hint}
          </span>
        )}
      </span>
      <Lock className="h-3.5 w-3.5 text-[var(--ps-fg-muted)] transition-opacity group-hover/row:animate-[ps-pulse_1.6s_ease-in-out_infinite]" />
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
    setField(key, (value || null) as WelcomeField[K]);
  };

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <div className="ps-surface ps-shadow-raised relative overflow-hidden rounded-2xl">
        {/* Liseré violet en haut, signature de la carte. */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--ps-primary)] to-transparent" />

        {/* Header carte */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-[var(--ps-primary-subtle)] to-white px-5 py-4">
          <div className="ps-glow-violet-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ps-primary)] to-[var(--ps-primary-deep)] text-[14px] font-bold tracking-wider text-white ps-num">
            {initials(fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[var(--ps-fg)]">{fullName}</p>
            {company && (
              <p className="truncate text-[12.5px] text-[var(--ps-fg-muted)]">{company}</p>
            )}
          </div>
          <span className="ps-fade-in flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 ring-1 ring-emerald-200/70">
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
          <ReadOnlyRow icon={Mail} label="Email" value={email} hint="Login" />
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
