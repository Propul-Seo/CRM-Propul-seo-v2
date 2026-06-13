// Router des étapes du questionnaire selon project_type.
// 3 parcours : 'site' (8 steps), 'erp' (8 steps), 'site_erp' (12 steps).

import type { ReactNode } from 'react';
import type { ZodSchema } from 'zod';

import {
  step0Schema, step1Schema, step2Schema, step3Schema, step4Schema,
  step5Schema, step6Schema, step7Schema,
  stepErp1Schema, stepErp2Schema, stepErp3Schema, stepErp4Schema,
  type QualificationDraft,
} from './schema';

import { Step0ProjectType } from './steps/Step0ProjectType';
import { Step1Identity } from './steps/Step1Identity';
import { Step2Situation } from './steps/Step2Situation';
import { Step3Objectives } from './steps/Step3Objectives';
import { Step4Features } from './steps/Step4Features';
import { Step5Brand } from './steps/Step5Brand';
import { Step6Budget } from './steps/Step6Budget';
import { Step7Finalization } from './steps/Step7Finalization';
import { StepErp1System } from './steps/StepErp1System';
import { StepErp2Modules } from './steps/StepErp2Modules';
import { StepErp3Users } from './steps/StepErp3Users';
import { StepErp4Integrations } from './steps/StepErp4Integrations';

export interface BaseStepProps {
  draft: QualificationDraft;
  setField: <K extends keyof QualificationDraft>(key: K, value: QualificationDraft[K]) => void;
  errors: Record<string, string | undefined>;
  leadId: string | null;
}

export interface StepConfig {
  key: string;
  schema: ZodSchema;
  render: (props: BaseStepProps) => ReactNode;
}

const STEP_DEFS = {
  step0: { key: 'project_type', schema: step0Schema, render: (p: BaseStepProps) =>
    <Step0ProjectType draft={p.draft} setField={p.setField} errors={p.errors} /> },
  step1: { key: 'identity', schema: step1Schema, render: (p: BaseStepProps) =>
    <Step1Identity draft={p.draft} setField={p.setField} errors={p.errors} /> },
  step2: { key: 'situation', schema: step2Schema, render: (p: BaseStepProps) =>
    <Step2Situation draft={p.draft} setField={p.setField} errors={p.errors} /> },
  step3: { key: 'objectives', schema: step3Schema, render: (p: BaseStepProps) =>
    <Step3Objectives draft={p.draft} setField={p.setField} errors={p.errors} /> },
  step4: { key: 'features', schema: step4Schema, render: (p: BaseStepProps) =>
    <Step4Features draft={p.draft} setField={p.setField} errors={p.errors} /> },
  step5: { key: 'brand', schema: step5Schema, render: (p: BaseStepProps) =>
    <Step5Brand draft={p.draft} leadId={p.leadId} setField={p.setField} errors={p.errors} /> },
  step6: { key: 'budget', schema: step6Schema, render: (p: BaseStepProps) =>
    <Step6Budget draft={p.draft} setField={p.setField} errors={p.errors} /> },
  step7: { key: 'finalization', schema: step7Schema, render: (p: BaseStepProps) =>
    <Step7Finalization draft={p.draft} setField={p.setField} errors={p.errors} /> },
  erp1: { key: 'erp_system', schema: stepErp1Schema, render: (p: BaseStepProps) =>
    <StepErp1System draft={p.draft} setField={p.setField} errors={p.errors} /> },
  erp2: { key: 'erp_modules', schema: stepErp2Schema, render: (p: BaseStepProps) =>
    <StepErp2Modules draft={p.draft} setField={p.setField} errors={p.errors} /> },
  erp3: { key: 'erp_users', schema: stepErp3Schema, render: (p: BaseStepProps) =>
    <StepErp3Users draft={p.draft} setField={p.setField} errors={p.errors} /> },
  erp4: { key: 'erp_integrations', schema: stepErp4Schema, render: (p: BaseStepProps) =>
    <StepErp4Integrations draft={p.draft} setField={p.setField} errors={p.errors} /> },
} satisfies Record<string, StepConfig>;

export function getStepFlow(projectType: QualificationDraft['project_type']): StepConfig[] {
  switch (projectType) {
    case 'erp':
      return [STEP_DEFS.step0, STEP_DEFS.step1, STEP_DEFS.erp1, STEP_DEFS.erp2,
              STEP_DEFS.erp3, STEP_DEFS.erp4, STEP_DEFS.step6, STEP_DEFS.step7];
    case 'site_erp':
      return [STEP_DEFS.step0, STEP_DEFS.step1, STEP_DEFS.step2, STEP_DEFS.step3,
              STEP_DEFS.step4, STEP_DEFS.step5, STEP_DEFS.erp1, STEP_DEFS.erp2,
              STEP_DEFS.erp3, STEP_DEFS.erp4, STEP_DEFS.step6, STEP_DEFS.step7];
    case 'site':
    default:
      return [STEP_DEFS.step0, STEP_DEFS.step1, STEP_DEFS.step2, STEP_DEFS.step3,
              STEP_DEFS.step4, STEP_DEFS.step5, STEP_DEFS.step6, STEP_DEFS.step7];
  }
}

// Skip logique : si "pas de site existant", on saute 'objectives' (step3) car
// les questions concurrents/objectifs site n'ont pas de sens sans site.
// Forward : depuis 'situation' (step2) → saute 'objectives' (step3) → atterrit
// sur 'features' (step4). Backward : depuis 'features' (step4) → re-saute
// 'objectives' (jamais vu à l'aller) → revient à 'situation' (step2).
export function shouldSkipForward(currentKey: string, draft: QualificationDraft): boolean {
  return currentKey === 'situation' && draft.has_existing_site === 'non';
}

export function shouldSkipBackward(currentKey: string, draft: QualificationDraft): boolean {
  return currentKey === 'features' && draft.has_existing_site === 'non';
}
