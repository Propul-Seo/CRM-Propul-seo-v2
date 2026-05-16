import { CalendarDays } from 'lucide-react';
import { RadioCard } from '../components/RadioCard';
import { RecapAccordion } from '../components/RecapAccordion';
import { DECISION_MAKERS, PREFERRED_CONTACTS } from '../constants';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step7Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

export function Step7Finalization({ draft, setField, errors }: Step7Props) {
  return (
    <StepShell title="Pour finaliser" subtitle="Dernière ligne droite. Vérifiez votre récap ci-dessous.">
      <FieldGroup label="Qui prend la décision ?" required error={errors.is_decision_maker}>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {DECISION_MAKERS.map(o => (
            <RadioCard
              key={o.value}
              name="is_decision_maker"
              value={o.value}
              checked={draft.is_decision_maker === o.value}
              onChange={v => setField('is_decision_maker', v as QualificationDraft['is_decision_maker'])}
              label={o.label}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Comment vous recontacter ?" required error={errors.preferred_contact_method}>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {PREFERRED_CONTACTS.map(o => (
            <RadioCard
              key={o.value}
              name="preferred_contact_method"
              value={o.value}
              checked={draft.preferred_contact_method === o.value}
              onChange={v => setField('preferred_contact_method', v as QualificationDraft['preferred_contact_method'])}
              label={o.label}
            />
          ))}
        </div>
      </FieldGroup>

      <div>
        <p className="ps-eyebrow ps-eyebrow-muted mb-2">Récapitulatif</p>
        <RecapAccordion draft={draft} />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-[var(--ps-border-soft)] bg-[var(--ps-bg-subtle)] px-4 py-3">
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--ps-primary-text)]" />
        <p className="flex-1 text-[12.5px] text-[var(--ps-fg-secondary)]">
          Vous pouvez aussi réserver un RDV 30 min directement.
        </p>
        <button
          type="button"
          disabled
          className="rounded-md border border-[var(--ps-border)] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[var(--ps-fg-muted)] opacity-60"
        >
          Réserver — bientôt
        </button>
      </div>
    </StepShell>
  );
}
