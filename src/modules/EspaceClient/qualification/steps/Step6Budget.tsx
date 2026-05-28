import { RadioCard } from '../components/RadioCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { BUDGET_RANGES, DEADLINES } from '../constants';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step6Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Apparition progressive : budget → délai.
export function Step6Budget({ draft, setField, errors }: Step6Props) {
  const budgetFilled = !!draft.budget_range;
  const revealed = useProgressiveReveal([budgetFilled]);

  return (
    <StepShell title="Budget et délais" subtitle="Soyez honnête — on adapte la proposition à votre réalité.">
      <FieldGroup label="Fourchette de budget" required error={errors.budget_range}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {BUDGET_RANGES.map(o => (
            <RadioCard
              key={o.value}
              name="budget_range"
              value={o.value}
              checked={draft.budget_range === o.value}
              onChange={v => setField('budget_range', v as QualificationDraft['budget_range'])}
              label={o.label}
              emoji={o.emoji}
            />
          ))}
        </div>
      </FieldGroup>

      <ConditionalBranch show={revealed >= 2}>
        <FieldGroup label="Délai souhaité" required error={errors.desired_timeline}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {DEADLINES.map(o => (
              <RadioCard
                key={o.value}
                name="desired_timeline"
                value={o.value}
                checked={draft.desired_timeline === o.value}
                onChange={v => setField('desired_timeline', v as QualificationDraft['desired_timeline'])}
                label={o.label}
              />
            ))}
          </div>
        </FieldGroup>
      </ConditionalBranch>
    </StepShell>
  );
}
