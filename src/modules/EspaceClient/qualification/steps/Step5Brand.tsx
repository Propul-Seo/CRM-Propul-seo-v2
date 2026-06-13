import { Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
    <StepShell title="Votre identité visuelle" subtitle="Indiquez les éléments graphiques déjà disponibles pour le projet.">
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
        <div className="ps-branch-panel space-y-5 p-4 md:p-5">
          <FieldGroup label="Logo (optionnel)" error={errors.logo_file_url}>
            <FileUploadZone
              kind="logo"
              leadId={leadId}
              paths={draft.logo_file_url ? [draft.logo_file_url] : []}
              onChange={paths => setField('logo_file_url', paths[0] ?? null)}
              maxFiles={FILE_UPLOAD_LIMITS.logo.maxFiles}
              maxSizeMb={FILE_UPLOAD_LIMITS.logo.maxSizeMb}
              accept={FILE_UPLOAD_LIMITS.logo.accept}
              hint="SVG, PNG, JPG ou AI. Taille maximale : 10 MB"
            />
          </FieldGroup>

          <ConditionalBranch show={conditionalRules.showBrandGuideUpload(draft)}>
            <FieldGroup
              label="Charte graphique (optionnel)"
              hint="PDF, image ou archive ZIP. Taille maximale : 25 MB. Vous pouvez aussi fournir un lien externe plus tard."
              error={errors.brand_guide_url}
            >
              <FileUploadZone
                kind="brand-guide"
                leadId={leadId}
                paths={draft.brand_guide_url ? [draft.brand_guide_url] : []}
                onChange={paths => setField('brand_guide_url', paths[0] ?? null)}
                maxFiles={FILE_UPLOAD_LIMITS.brandGuide.maxFiles}
                maxSizeMb={FILE_UPLOAD_LIMITS.brandGuide.maxSizeMb}
                accept={FILE_UPLOAD_LIMITS.brandGuide.accept}
                hint="Formats acceptés : PDF, PNG, JPG, AI, SVG, ZIP, Sketch, Figma…"
              />
            </FieldGroup>

            <FieldGroup
              label={
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-violet-600" />
                  Ou un lien externe vers votre charte
                </span>
              }
              hint="WeTransfer, Notion, Drive, Dropbox… (en alternative à l'upload)"
              error={errors.brand_guide_external_link}
            >
              <Input
                type="url"
                placeholder="https://wetransfer.com/downloads/..."
                value={draft.brand_guide_external_link ?? ''}
                onChange={e => setField('brand_guide_external_link', e.target.value)}
                className="h-11 bg-white"
              />
            </FieldGroup>
          </ConditionalBranch>
        </div>
      </ConditionalBranch>
    </StepShell>
  );
}
