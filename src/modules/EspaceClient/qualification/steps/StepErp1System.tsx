import { Input } from '@/components/ui/input';
import { RadioCard } from '../components/RadioCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { ERP_CURRENT_SYSTEMS, ERP_DATA_VOLUMES } from '../constants.erp';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

export function StepErp1System({ draft, setField, errors }: Props) {
  const showOther = draft.erp_current_system === 'autre';

  return (
    <StepShell
      title="Votre système actuel"
      subtitle="Ce qu'on remplace ou complète. On évalue le travail de migration."
    >
      <FieldGroup
        label="Qu'utilisez-vous aujourd'hui ?"
        required
        hint="Le système principal sur lequel vous gérez votre activité."
        error={errors.erp_current_system}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ERP_CURRENT_SYSTEMS.map(s => (
            <RadioCard
              key={s.value}
              name="erp_current_system"
              value={s.value}
              checked={draft.erp_current_system === s.value}
              onChange={v => setField('erp_current_system', v as QualificationDraft['erp_current_system'])}
              label={s.label}
              hint={s.hint}
            />
          ))}
        </div>
      </FieldGroup>

      <ConditionalBranch show={showOther}>
        <FieldGroup
          label="Précisez votre système"
          required
          hint="Indiquez le nom du logiciel ou de la solution actuelle."
          error={errors.erp_current_system_other}
        >
          <Input
            placeholder="Ex. Cegid, Dolibarr, Quickbooks, solution maison…"
            value={draft.erp_current_system_other ?? ''}
            onChange={e => setField('erp_current_system_other', e.target.value)}
            className="h-11"
            maxLength={500}
          />
        </FieldGroup>
      </ConditionalBranch>

      <FieldGroup
        label="Volume de données à migrer"
        required
        hint="Approximatif. On affinera ensemble."
        error={errors.erp_data_volume}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ERP_DATA_VOLUMES.map(v => (
            <RadioCard
              key={v.value}
              name="erp_data_volume"
              value={v.value}
              checked={draft.erp_data_volume === v.value}
              onChange={val => setField('erp_data_volume', val as QualificationDraft['erp_data_volume'])}
              label={v.label}
              hint={v.hint}
            />
          ))}
        </div>
      </FieldGroup>
    </StepShell>
  );
}
