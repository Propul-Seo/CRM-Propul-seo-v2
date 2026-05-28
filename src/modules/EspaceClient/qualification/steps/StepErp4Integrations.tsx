import { Input } from '@/components/ui/input';
import { CheckboxCard } from '../components/CheckboxCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { ERP_INTEGRATIONS } from '../constants.erp';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

export function StepErp4Integrations({ draft, setField, errors }: Props) {
  const selected = draft.erp_integrations ?? [];
  const showOther = selected.includes('autre');

  const toggle = (value: string, isChecked: boolean) => {
    const next = isChecked
      ? [...selected.filter(v => v !== value), value]
      : selected.filter(v => v !== value);
    setField('erp_integrations', next as QualificationDraft['erp_integrations']);
  };

  return (
    <StepShell
      title="Intégrations souhaitées"
      subtitle="Avec quels outils l'ERP doit se connecter. Optionnel — on peut commencer simple."
    >
      <FieldGroup
        label="Intégrations possibles"
        hint="Sélectionnez ce qui vous intéresse. Vide = on regardera plus tard."
        error={errors.erp_integrations}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ERP_INTEGRATIONS.map(i => (
            <CheckboxCard
              key={i.value}
              name="erp_integrations"
              value={i.value}
              checked={selected.includes(i.value)}
              onChange={checked => toggle(i.value, checked)}
              label={i.label}
              hint={i.hint}
            />
          ))}
        </div>
      </FieldGroup>

      <ConditionalBranch show={showOther}>
        <FieldGroup
          label="Précisez l'intégration"
          required
          hint="Quel autre outil l'ERP doit-il connecter ?"
          error={errors.erp_integrations_other}
        >
          <Input
            placeholder="Ex. Salesforce, HubSpot, ZohoCRM, ERP existant…"
            value={draft.erp_integrations_other ?? ''}
            onChange={e => setField('erp_integrations_other', e.target.value)}
            className="h-11"
            maxLength={500}
          />
        </FieldGroup>
      </ConditionalBranch>
    </StepShell>
  );
}
