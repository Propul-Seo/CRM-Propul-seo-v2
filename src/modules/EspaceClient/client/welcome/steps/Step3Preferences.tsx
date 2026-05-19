import type { LucideIcon } from 'lucide-react';
import { Mail, Phone, MessageSquare, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type {
  UseWelcomeWizardResult, PreferredChannel, AvailabilitySlot,
} from '../useWelcomeWizard';

interface ChannelOption {
  value: PreferredChannel;
  label: string;
  icon: LucideIcon;
}
const CHANNELS: ChannelOption[] = [
  { value: 'email',    label: 'Email',     icon: Mail },
  { value: 'phone',    label: 'Téléphone', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp',  icon: MessageSquare },
];

interface SlotOption {
  value: AvailabilitySlot;
  label: string;
  hint: string;
}
const SLOTS: SlotOption[] = [
  { value: 'morning',   label: 'Matin',       hint: '8 h – 12 h'  },
  { value: 'afternoon', label: 'Après-midi',  hint: '14 h – 18 h' },
  { value: 'evening',   label: 'Soir',        hint: '18 h – 20 h' },
];

// Classe partagée pour le rendu de base d'une pill (channel + slot).
const PILL_BASE =
  'ps-tap inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-[var(--ps-dur-fast)]';

// Divider doux en dégradé (transparent → border → transparent) pour les séparateurs de lignes.
const ROW_DIVIDER =
  '[&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:inset-x-0 [&>*+*]:before:top-0 [&>*+*]:before:h-px ' +
  "[&>*+*]:before:bg-[linear-gradient(to_right,transparent,var(--ps-border-soft),transparent)] [&>*+*]:before:content-['']";

// Layout commun pour chaque ligne (label + sous-label à gauche, contrôle à droite).
function PrefRow({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-6 md:grid-cols-[180px_1fr] md:gap-8">
      <div>
        <p className="text-[13.5px] font-semibold text-[var(--ps-fg)]">{title}</p>
        <p className="mt-0.5 text-[11.5px] text-[var(--ps-fg-muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

interface Step3PreferencesProps {
  wizard: UseWelcomeWizardResult;
}

export function Step3Preferences({ wizard }: Step3PreferencesProps) {
  const { row, setField } = wizard;
  const channel = (row?.preferred_channel ?? 'email') as PreferredChannel;
  const slots = (row?.availability_slots ?? ['afternoon']) as AvailabilitySlot[];
  const notif = row?.email_notifications ?? true;

  const toggleSlot = (slot: AvailabilitySlot) => {
    const next = slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot];
    setField('availability_slots', next);
  };

  return (
    <div className="mx-auto max-w-[640px]">
      <div className={ROW_DIVIDER}>
        {/* Ligne 1 — Canal préféré (mutex) */}
        <PrefRow title="Canal préféré" subtitle="Comment vous prévenir en priorité.">
          <div role="radiogroup" aria-label="Canal préféré" className="flex flex-wrap gap-2">
            {CHANNELS.map(opt => {
              const Icon = opt.icon;
              const active = channel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setField('preferred_channel', opt.value)}
                  className={cn(
                    PILL_BASE,
                    active
                      ? 'ps-pill-active bg-[var(--ps-primary)] text-white'
                      : 'border border-[var(--ps-border)] bg-white text-[var(--ps-fg)] hover:border-[var(--ps-primary)]/40 hover:bg-[var(--ps-bg-subtle)]',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </PrefRow>

        {/* Ligne 2 — Plages (multi) */}
        <PrefRow title="Plages" subtitle="Quand vous joindre.">
          <div role="group" aria-label="Plages horaires" className="flex flex-wrap gap-2">
            {SLOTS.map(opt => {
              const active = slots.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  onClick={() => toggleSlot(opt.value)}
                  className={cn(
                    PILL_BASE,
                    active
                      ? 'ps-pill-active bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]'
                      : 'border border-[var(--ps-border)] bg-white text-[var(--ps-fg)] hover:border-[var(--ps-primary)]/40 hover:bg-[var(--ps-bg-subtle)]',
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  <span>{opt.label}</span>
                  <span className="text-[11px] text-[var(--ps-fg-muted)]">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </PrefRow>

        {/* Ligne 3 — Notifications email (toggle) */}
        <PrefRow title="Notifications" subtitle="Par email, événements clés uniquement.">
          <div className="flex items-center gap-3">
            <Switch
              checked={notif}
              onCheckedChange={v => setField('email_notifications', v)}
              aria-label="Notifications email"
              className="ps-tap transition-transform hover:scale-[1.04]"
            />
            <span
              className={cn(
                'rounded-md border-l-2 py-0.5 pl-2.5 text-[12.5px] transition-colors duration-200',
                notif
                  ? 'border-[var(--ps-primary)]/60 text-[var(--ps-fg-secondary)]'
                  : 'border-[var(--ps-border)] text-[var(--ps-fg-muted)]',
              )}
            >
              {notif
                ? 'Activé · vous recevrez livrables, factures, signatures à effectuer'
                : 'Désactivé · uniquement notifications dans l\'app'}
            </span>
          </div>
        </PrefRow>
      </div>

      <p className="mt-3 px-1 text-[11.5px] text-[var(--ps-fg-muted)]">
        Vous pouvez ajuster ces préférences à tout moment depuis votre profil.
      </p>
    </div>
  );
}
