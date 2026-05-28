import { Input } from '@/components/ui/input';
import { CheckboxCard } from '../components/CheckboxCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { ERP_MODULES } from '../constants.erp';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

export function StepErp2Modules({ draft, setField, errors }: Props) {
  const selected = draft.erp_modules ?? [];
  const showOther = selected.includes('autre');

  const toggle = (value: string, isChecked: boolean) => {
    const next = isChecked
      ? [...selected.filter(v => v !== value), value]
      : selected.filter(v => v !== value);
    setField('erp_modules', next as QualificationDraft['erp_modules']);
  };

  return (
    <StepShell
      title="Quels modules métier ?"
      subtitle="Cochez tout ce qui s'applique. On peut en discuter ensuite."
    >
      <FieldGroup
        label="Modules nécessaires"
        required
        hint="Au moins un. On définira les priorités en RDV."
        error={errors.erp_modules}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ERP_MODULES.map(m => (
            <CheckboxCard
              key={m.value}
              name="erp_modules"
              value={m.value}
              checked={selected.includes(m.value)}
              onChange={checked => toggle(m.value, checked)}
              label={m.label}
              hint={m.hint}
            />
          ))}
        </div>
      </FieldGroup>

      <ConditionalBranch show={showOther}>
        <FieldGroup
          label="Précisez le module"
          required
          hint="Quel module supplémentaire vous est essentiel ?"
          error={errors.erp_modules_other}
        >
          <Input
            placeholder="Ex. gestion de production, service après-vente, ticketing…"
            value={draft.erp_modules_other ?? ''}
            onChange={e => setField('erp_modules_other', e.target.value)}
            className="h-11"
            maxLength={500}
          />
        </FieldGroup>
      </ConditionalBranch>
    </StepShell>
  );
}
