import type { LucideIcon } from 'lucide-react';
import { Mail, Phone, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  UseWelcomeWizardResult, PreferredChannel, AvailabilitySlot,
} from '../useWelcomeWizard';

interface ChannelOption { value: PreferredChannel; label: string; icon: LucideIcon }
const CHANNELS: ChannelOption[] = [
  { value: 'email',    label: 'Email',     icon: Mail },
  { value: 'phone',    label: 'Téléphone', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp',  icon: MessageSquare },
];

interface SlotOption { value: AvailabilitySlot; label: string; hint: string }
const SLOTS: SlotOption[] = [
  { value: 'morning',   label: 'Matin',       hint: '8 h – 12 h' },
  { value: 'afternoon', label: 'Après-midi',  hint: '14 h – 18 h' },
  { value: 'evening',   label: 'Soir',        hint: '18 h – 20 h' },
];

function PrefRow({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-5 md:grid-cols-[180px_1fr] md:gap-6">
      <div>
        <p className="text-[13.5px] font-semibold text-[var(--ps-fg)]">{title}</p>
        <p className="mt-0.5 text-[11.5px] text-[var(--ps-fg-muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

interface Step3PreferencesProps { wizard: UseWelcomeWizardResult }

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
    <div className="mx-auto w-full max-w-[600px] rounded-3xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-elevated)] p-6 shadow-[var(--ps-shadow-floating)]">
      <div className="divide-y divide-[var(--ps-border-soft)]">
        <PrefRow title="Canal préféré" subtitle="Comment vous prévenir en priorité.">
          <div role="radiogroup" aria-label="Canal préféré" className="flex flex-wrap gap-2">
            {CHANNELS.map(opt => {
              const Icon = opt.icon;
              const active = channel === opt.value;
              return (
                <button key={opt.value} type="button" role="radio" aria-checked={active}
                  onClick={() => setField('preferred_channel', opt.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all',
                    active
                      ? 'ps-brand-gradient ps-pill-active text-white'
                      : 'border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] text-[var(--ps-fg-secondary)] hover:border-[var(--ps-border-strong)] hover:bg-[var(--ps-bg-subtle)]',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />{opt.label}
                </button>
              );
            })}
          </div>
        </PrefRow>

        <PrefRow title="Plages" subtitle="Quand vous joindre.">
          <div role="group" aria-label="Plages horaires" className="flex flex-wrap gap-2">
            {SLOTS.map(opt => {
              const active = slots.includes(opt.value);
              return (
                <button key={opt.value} type="button" role="checkbox" aria-checked={active}
                  onClick={() => toggleSlot(opt.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all',
                    active
                      ? 'ps-pill-active bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)]'
                      : 'border border-[var(--ps-border)] bg-[var(--ps-bg-elevated)] text-[var(--ps-fg-secondary)] hover:border-[var(--ps-border-strong)]',
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  <span>{opt.label}</span>
                  <span className={cn('text-[11px]', active ? 'text-[var(--ps-primary-text)] opacity-70' : 'text-[var(--ps-fg-muted)]')}>{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </PrefRow>

        <PrefRow title="Notifications" subtitle="Par email, événements clés uniquement.">
          <div className="flex items-center gap-3">
            {/* Toggle custom — le Switch shadcn applique bg-background sur le thumb
                qui est dark dans le theme CRM, d'où un rond noir invisible.
                On garde la sémantique role=switch + aria-checked. */}
            <button
              type="button"
              role="switch"
              aria-checked={notif}
              aria-label="Notifications email"
              onClick={() => setField('email_notifications', !notif)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                notif
                  ? 'bg-[var(--ps-primary)] shadow-inner'
                  : 'bg-[var(--ps-border-strong)]',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200',
                  notif ? 'translate-x-[22px]' : 'translate-x-0.5',
                )}
              />
            </button>
            <span className={cn(
              'rounded-md border-l-2 py-0.5 pl-2.5 text-[12.5px]',
              notif ? 'border-[var(--ps-primary)] text-[var(--ps-fg-secondary)]' : 'border-[var(--ps-border)] text-[var(--ps-fg-muted)]',
            )}>
              {notif
                ? 'Activé · vous recevrez livrables, factures, signatures à effectuer'
                : 'Désactivé · uniquement notifications dans l\'app'}
            </span>
          </div>
        </PrefRow>
      </div>

      <p className="mt-3 px-1 text-[11.5px] text-[var(--ps-fg-secondary)]">
        Vous pouvez ajuster ces préférences à tout moment depuis votre profil.
      </p>
    </div>
  );
}
