import { RadioCard } from '../components/RadioCard';
import { ConditionalBranch } from '../components/ConditionalBranch';
import { FileUploadZone } from '../components/FileUploadZone';
import { BRAND_STATUS, FILE_UPLOAD_LIMITS } from '../constants';
import { conditionalRules } from '../conditionalRules';
import type { QualificationDraft } from '../schema';
import { StepShell, FieldGroup } from './_StepShell';

interface Step5Props {
  draft: QualificationDraft;
  leadId: string | null;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
}

export function Step5Brand({ draft, leadId, setField, errors }: Step5Props) {
  return (
    <StepShell title="Votre identité visuelle" subtitle="Logo, charte, ou point de départ vierge ?">
      <FieldGroup label="Où en êtes-vous ?" required error={errors.has_visual_identity}>
        <div className="grid gap-2.5 md:grid-cols-3">
          {BRAND_STATUS.map(o => (
            <RadioCard
              key={o.value}
              name="has_visual_identity"
              value={o.value}
              checked={draft.has_visual_identity === o.value}
              onChange={v => setField('has_visual_identity', v as QualificationDraft['has_visual_identity'])}
              label={o.label}
              hint={o.hint}
            />
          ))}
        </div>
      </FieldGroup>

      <ConditionalBranch show={conditionalRules.showLogoUpload(draft)}>
        <div className="space-y-5 border-l-2 border-[var(--ps-primary-subtle)] pl-4">
          <FieldGroup label="Logo" required error={errors.logo_file_url}>
            <FileUploadZone
              kind="logo"
              leadId={leadId}
              paths={draft.logo_file_url ? [draft.logo_file_url] : []}
              onChange={paths => setField('logo_file_url', paths[0] ?? null)}
              maxFiles={FILE_UPLOAD_LIMITS.logo.maxFiles}
              maxSizeMb={FILE_UPLOAD_LIMITS.logo.maxSizeMb}
              accept={FILE_UPLOAD_LIMITS.logo.accept}
              hint="SVG, PNG, JPG ou AI · max 10 MB"
            />
          </FieldGroup>

          <ConditionalBranch show={conditionalRules.showBrandGuideUpload(draft)}>
            <FieldGroup label="Charte graphique PDF" required error={errors.brand_guide_url}>
              <FileUploadZone
                kind="brand-guide"
                leadId={leadId}
                paths={draft.brand_guide_url ? [draft.brand_guide_url] : []}
                onChange={paths => setField('brand_guide_url', paths[0] ?? null)}
                maxFiles={FILE_UPLOAD_LIMITS.brandGuide.maxFiles}
                maxSizeMb={FILE_UPLOAD_LIMITS.brandGuide.maxSizeMb}
                accept={FILE_UPLOAD_LIMITS.brandGuide.accept}
                hint="PDF uniquement · max 25 MB"
              />
            </FieldGroup>
          </ConditionalBranch>
        </div>
      </ConditionalBranch>
    </StepShell>
  );
}
