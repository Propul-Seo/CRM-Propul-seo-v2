import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxCard } from '../components/CheckboxCard';
import { RadioCard } from '../components/RadioCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { DESIRED_FEATURES, ECOMMERCE_PLATFORMS, PRODUCT_COUNT_RANGES, RESERVATION_TYPES } from '../constants';
import { conditionalRules } from '../conditionalRules';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step4Props {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

// Apparition progressive dans la branche e-commerce : plateforme → volume.
export function Step4Features({ draft, setField, errors }: Step4Props) {
  function toggleFeature(value: string, on: boolean) {
    const current = draft.desired_features ?? [];
    const next = on ? [...current, value] : current.filter(v => v !== value);
    setField('desired_features', next as QualificationDraft['desired_features']);
  }

  const showEcommerce = conditionalRules.showEcommerceDetails(draft);
  const showReservation = conditionalRules.showReservationDetails(draft);
  const platformFilled = !!draft.ecommerce_platform;
  const ecommerceRevealed = useProgressiveReveal([platformFilled]);

  return (
    <StepShell title="Fonctionnalités souhaitées" subtitle="Sélectionnez les fonctionnalités envisagées pour cadrer le périmètre fonctionnel.">
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

      <ConditionalBranch show={(draft.desired_features ?? []).includes('autre')}>
        <FieldGroup
          label="Précisez la fonctionnalité"
          required
          hint="Décrivez brièvement la fonctionnalité attendue."
          error={errors.desired_features_other}
        >
          <Textarea
            placeholder="Par exemple : comparateur de produits, configurateur 3D, espace partenaire avec API"
            rows={2}
            value={draft.desired_features_other ?? ''}
            onChange={e => setField('desired_features_other', e.target.value)}
            maxLength={500}
          />
        </FieldGroup>
      </ConditionalBranch>

      <ConditionalBranch show={showEcommerce}>
        <div className="ps-branch-panel space-y-5 p-4 md:p-5">
          <FieldGroup label="Plateforme de commerce en ligne actuelle" required error={errors.ecommerce_platform}>
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

          <ConditionalBranch show={draft.ecommerce_platform === 'autre'}>
            <FieldGroup
              label="Précisez la plateforme"
              required
              hint="Nom exact de la plateforme actuelle."
              error={errors.ecommerce_platform_other}
            >
              <Input
                placeholder="Par exemple : Magento, BigCommerce, Wix Stores"
                value={draft.ecommerce_platform_other ?? ''}
                onChange={e => setField('ecommerce_platform_other', e.target.value)}
                className="h-11 bg-white"
                maxLength={500}
              />
            </FieldGroup>
          </ConditionalBranch>

          <ConditionalBranch show={ecommerceRevealed >= 2}>
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
          </ConditionalBranch>
        </div>
      </ConditionalBranch>

      <ConditionalBranch show={showReservation}>
        <div className="ps-branch-panel space-y-5 p-4 md:p-5">
          <FieldGroup label="Type de réservation" required error={errors.reservation_type}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {RESERVATION_TYPES.map(o => (
                <RadioCard
                  key={o.value}
                  name="reservation_type"
                  value={o.value}
                  checked={draft.reservation_type === o.value}
                  onChange={v => setField('reservation_type', v as QualificationDraft['reservation_type'])}
                  label={o.label}
                  hint={o.hint}
                />
              ))}
            </div>
          </FieldGroup>
        </div>
      </ConditionalBranch>
    </StepShell>
  );
}
