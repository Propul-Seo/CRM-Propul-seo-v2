import { Textarea } from '@/components/ui/textarea';
import { RadioCard } from '../components/RadioCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { MAIN_GOALS, TARGET_AUDIENCES } from '../constants';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step3Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Apparition progressive : objectif → public cible → concurrents (optionnel).
export function Step3Objectives({ draft, setField, errors }: Step3Props) {
  const goalFilled = !!draft.main_goal;
  const audienceFilled = !!draft.target_audience;
  const revealed = useProgressiveReveal([goalFilled, audienceFilled]);

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

      <ConditionalBranch show={draft.main_goal === 'autre'}>
        <FieldGroup
          label="Précisez votre objectif"
          required
          hint="Décrivez en quelques mots ce que vous cherchez à atteindre."
          error={errors.main_goal_other}
        >
          <Textarea
            placeholder="Ex. fidéliser ma clientèle existante, valoriser mon savoir-faire artisanal…"
            rows={2}
            value={draft.main_goal_other ?? ''}
            onChange={e => setField('main_goal_other', e.target.value)}
            maxLength={500}
          />
        </FieldGroup>
      </ConditionalBranch>

      <ConditionalBranch show={revealed >= 2}>
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
      </ConditionalBranch>

      <ConditionalBranch show={revealed >= 3}>
        <FieldGroup
          label="2-3 concurrents ou sites que vous aimez · optionnel"
          hint="Donnez-nous des exemples pour comprendre votre positionnement."
          error={errors.competitors}
        >
          <Textarea
            placeholder="apple.com, stripe.com, airbnb.com"
            rows={3}
            value={draft.competitors ?? ''}
            onChange={e => setField('competitors', e.target.value)}
          />
        </FieldGroup>
      </ConditionalBranch>
    </StepShell>
  );
}
