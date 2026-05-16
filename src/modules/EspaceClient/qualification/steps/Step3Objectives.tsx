import { Textarea } from '@/components/ui/textarea';
import { RadioCard } from '../components/RadioCard';
import { MAIN_GOALS, TARGET_AUDIENCES } from '../constants';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step3Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

export function Step3Objectives({ draft, setField, errors }: Step3Props) {
  return (
    <StepShell title="Vos objectifs" subtitle="Pour cibler la proposition sur ce qui compte vraiment.">
      <FieldGroup label="Objectif principal" required error={errors.main_goal}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MAIN_GOALS.map(o => (
            <RadioCard
              key={o.value}
              name="main_goal"
              value={o.value}
              checked={draft.main_goal === o.value}
              onChange={v => setField('main_goal', v as QualificationDraft['main_goal'])}
              label={o.label}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Public cible" required error={errors.target_audience}>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {TARGET_AUDIENCES.map(o => (
            <RadioCard
              key={o.value}
              name="target_audience"
              value={o.value}
              checked={draft.target_audience === o.value}
              onChange={v => setField('target_audience', v as QualificationDraft['target_audience'])}
              label={o.label}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup
        label="2-3 concurrents ou sites que vous aimez · optionnel"
        hint="Donnez-nous des exemples pour comprendre votre positionnement."
        error={errors.competitors}
      >
        <Textarea
          placeholder="messika.com, dinhvan.com, dior.com/joaillerie"
          rows={3}
          value={draft.competitors ?? ''}
          onChange={e => setField('competitors', e.target.value)}
        />
      </FieldGroup>
    </StepShell>
  );
}
