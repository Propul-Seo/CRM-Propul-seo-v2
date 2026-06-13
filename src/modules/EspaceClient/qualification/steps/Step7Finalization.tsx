import { RadioCard } from '../components/RadioCard';
import { RecapAccordion } from '../components/RecapAccordion';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { DECISION_MAKERS, PREFERRED_CONTACTS } from '../constants';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step7Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Apparition progressive : décideur → canal de contact → récap + RDV.
export function Step7Finalization({ draft, setField, errors }: Step7Props) {
  const decisionFilled = !!draft.is_decision_maker;
  const contactFilled = !!draft.preferred_contact_method;
  const revealed = useProgressiveReveal([decisionFilled, contactFilled]);

  return (
    <StepShell title="Finalisation" subtitle="Vérifiez les informations principales avant l’envoi du diagnostic.">
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

      <ConditionalBranch show={revealed >= 2}>
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
      </ConditionalBranch>

      <ConditionalBranch show={revealed >= 3}>
        <div className="ps-question-panel p-4 md:p-5">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-stone-500">Récapitulatif</p>
          <RecapAccordion draft={draft} />
        </div>
      </ConditionalBranch>
    </StepShell>
  );
}
