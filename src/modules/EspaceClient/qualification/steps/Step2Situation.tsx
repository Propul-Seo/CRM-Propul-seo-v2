import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioCard } from '../components/RadioCard';
import { CheckboxCard } from '../components/CheckboxCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { EXISTING_SITE_OPTIONS, MONTHLY_TRAFFIC, MAIN_PROBLEMS } from '../constants';
import { conditionalRules } from '../conditionalRules';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step2Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Apparition progressive dans la branche "site existant" : URL, trafic, problèmes.
export function Step2Situation({ draft, setField, errors }: Step2Props) {
  function toggleProblem(value: string, on: boolean) {
    const current = draft.main_problems ?? [];
    const next = on ? [...current, value] : current.filter(v => v !== value);
    setField('main_problems', next as QualificationDraft['main_problems']);
  }

  const showSiteBranch = conditionalRules.showExistingSiteDetails(draft);
  const urlFilled = !!draft.existing_site_url?.trim();
  const trafficFilled = !!draft.monthly_traffic;
  const branchRevealed = useProgressiveReveal([urlFilled, trafficFilled]);

  return (
    <StepShell title="Votre situation actuelle" subtitle="Ces éléments permettent d’évaluer le contexte de départ.">
      <FieldGroup label="Avez-vous déjà un site web ?" required error={errors.has_existing_site}>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {EXISTING_SITE_OPTIONS.map(o => (
            <RadioCard
              key={o.value}
              name="has_existing_site"
              value={o.value}
              checked={draft.has_existing_site === o.value}
              onChange={v => setField('has_existing_site', v as QualificationDraft['has_existing_site'])}
              label={o.label}
              hint={o.hint}
            />
          ))}
        </div>
      </FieldGroup>

      <ConditionalBranch show={showSiteBranch}>
        <div className="ps-branch-panel space-y-5 p-4 md:p-5">
          <FieldGroup
            label="URL de votre site actuel (optionnel)"
            hint="Vous pouvez laisser vide si le site n'est pas encore en ligne ou si vous préférez nous l'envoyer plus tard."
            error={errors.existing_site_url}
          >
            <Input
              type="url"
              placeholder="https://votre-site.fr"
              value={draft.existing_site_url ?? ''}
              onChange={e => setField('existing_site_url', e.target.value)}
              className="h-11 bg-white"
            />
          </FieldGroup>

          <ConditionalBranch show={branchRevealed >= 2}>
            <FieldGroup label="Trafic mensuel estimé" required error={errors.monthly_traffic}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {MONTHLY_TRAFFIC.map(o => (
                  <RadioCard
                    key={o.value}
                    name="monthly_traffic"
                    value={o.value}
                    checked={draft.monthly_traffic === o.value}
                    onChange={v => setField('monthly_traffic', v as QualificationDraft['monthly_traffic'])}
                    label={o.label}
                  />
                ))}
              </div>
            </FieldGroup>
          </ConditionalBranch>

          <ConditionalBranch show={branchRevealed >= 3}>
            <FieldGroup label="Principaux problèmes" required error={errors.main_problems}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {MAIN_PROBLEMS.map(o => (
                  <CheckboxCard
                    key={o.value}
                    name="main_problems"
                    value={o.value}
                    checked={(draft.main_problems ?? []).includes(o.value)}
                    onChange={on => toggleProblem(o.value, on)}
                    label={o.label}
                  />
                ))}
              </div>
            </FieldGroup>
          </ConditionalBranch>

          <ConditionalBranch show={(draft.main_problems ?? []).includes('autre')}>
            <FieldGroup
              label="Précisez le problème"
              required
              hint="Décrivez en quelques mots ce qui pose souci."
              error={errors.main_problems_other}
            >
              <Textarea
                placeholder="Par exemple : chargement lent, formulaire inactif, navigation peu claire"
                rows={2}
                value={draft.main_problems_other ?? ''}
                onChange={e => setField('main_problems_other', e.target.value)}
                maxLength={500}
              />
            </FieldGroup>
          </ConditionalBranch>
        </div>
      </ConditionalBranch>
    </StepShell>
  );
}
