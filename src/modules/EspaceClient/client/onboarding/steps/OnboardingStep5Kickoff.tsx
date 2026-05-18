import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { OnboardingRow } from '../useOnboarding';

interface Props {
  row: Partial<OnboardingRow> | null;
  setField: <K extends keyof OnboardingRow>(k: K, v: OnboardingRow[K]) => void;
}

// Format datetime-local : 'YYYY-MM-DDTHH:mm' (sans secondes, sans timezone)
// On stocke côté DB en UTC ISO. La conversion locale est faite ici.
function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function OnboardingStep5Kickoff({ row, setField }: Props) {
  const scheduled = row?.kickoff_call_scheduled_at;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] p-3">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ps-primary)]" />
        <div className="text-[12.5px] text-[var(--ps-fg-secondary)]">
          Le kickoff call est un appel d'<strong>1h</strong> pour aligner objectifs, planning et premières actions. Choisissez un créneau qui vous arrange — votre AE vous confirmera par email sous 24h.
        </div>
      </div>

      <div>
        <label className="text-[12.5px] font-semibold text-[var(--ps-fg)]">
          Créneau souhaité
        </label>
        <p className="mt-0.5 text-[11.5px] text-[var(--ps-fg-muted)]">
          Préférence pour les créneaux 10h-12h ou 14h-16h en semaine. Sinon mentionnez vos contraintes dans la voix de marque.
        </p>
        <Input
          type="datetime-local"
          value={toDateTimeLocal(scheduled)}
          onChange={(e) => setField('kickoff_call_scheduled_at', fromDateTimeLocal(e.target.value))}
          className="mt-1.5"
        />
      </div>

      {scheduled && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Créneau enregistré : <strong>{new Date(scheduled).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</strong>. Nous reviendrons vers vous pour confirmer.</span>
        </div>
      )}

      <p className="text-[11.5px] italic text-[var(--ps-fg-muted)]">
        L'intégration calendrier en 1 clic (Cal.com) arrive bientôt — pour l'instant on fait à l'ancienne.
      </p>
    </div>
  );
}
