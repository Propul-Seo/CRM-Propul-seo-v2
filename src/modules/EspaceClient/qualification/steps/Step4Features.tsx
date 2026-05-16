import { CheckboxCard } from '../components/CheckboxCard';
import { RadioCard } from '../components/RadioCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { DESIRED_FEATURES, ECOMMERCE_PLATFORMS, PRODUCT_COUNT_RANGES } from '../constants';
import { conditionalRules } from '../conditionalRules';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step4Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

export function Step4Features({ draft, setField, errors }: Step4Props) {
  function toggleFeature(value: string, on: boolean) {
    const current = draft.desired_features ?? [];
    const next = on ? [...current, value] : current.filter(v => v !== value);
    setField('desired_features', next as QualificationDraft['desired_features']);
  }

  return (
    <StepShell title="Fonctionnalités souhaitées" subtitle="Cochez tout ce qui vous intéresse — on affinera ensemble.">
      <FieldGroup label="Fonctionnalités envisagées" required error={errors.desired_features}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {DESIRED_FEATURES.map(o => (
            <CheckboxCard
              key={o.value}
              name="desired_features"
              value={o.value}
              checked={(draft.desired_features ?? []).includes(o.value)}
              onChange={on => toggleFeature(o.value, on)}
              label={o.label}
            />
          ))}
        </div>
      </FieldGroup>

      <ConditionalBranch show={conditionalRules.showEcommerceDetails(draft)}>
        <div className="space-y-5 border-l-2 border-[var(--ps-primary-subtle)] pl-4">
          <FieldGroup label="Plateforme e-commerce" required error={errors.ecommerce_platform}>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {ECOMMERCE_PLATFORMS.map(o => (
                <RadioCard
                  key={o.value}
                  name="ecommerce_platform"
                  value={o.value}
                  checked={draft.ecommerce_platform === o.value}
                  onChange={v => setField('ecommerce_platform', v as QualificationDraft['ecommerce_platform'])}
                  label={o.label}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Volume de produits" required error={errors.product_count_range}>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {PRODUCT_COUNT_RANGES.map(o => (
                <RadioCard
                  key={o.value}
                  name="product_count_range"
                  value={o.value}
                  checked={draft.product_count_range === o.value}
                  onChange={v => setField('product_count_range', v as QualificationDraft['product_count_range'])}
                  label={o.label}
                />
              ))}
            </div>
          </FieldGroup>
        </div>
      </ConditionalBranch>
    </StepShell>
  );
}
