import { z } from 'zod';
import {
  SECTORS, EXISTING_SITE_OPTIONS, MONTHLY_TRAFFIC, MAIN_PROBLEMS,
  MAIN_GOALS, TARGET_AUDIENCES, DESIRED_FEATURES, ECOMMERCE_PLATFORMS,
  PRODUCT_COUNT_RANGES, BRAND_STATUS, BUDGET_RANGES, DEADLINES,
  DECISION_MAKERS, PREFERRED_CONTACTS, RESERVATION_TYPES, PROJECT_TYPES,
} from './constants';
import {
  stepErp1Schema, stepErp2Schema, stepErp3Schema, stepErp4Schema,
  type StepErp1Data, type StepErp2Data, type StepErp3Data, type StepErp4Data,
} from './schema.erp';

export { stepErp1Schema, stepErp2Schema, stepErp3Schema, stepErp4Schema };
export type { StepErp1Data, StepErp2Data, StepErp3Data, StepErp4Data };

const values = <T extends ReadonlyArray<{ value: string }>>(arr: T): [string, ...string[]] => {
  const vals = arr.map(o => o.value);
  return [vals[0], ...vals.slice(1)];
};

// Validation téléphone : chiffres uniquement avec + international optionnel en tête.
const phoneRe = /^\+?\d{10,}$/;

// Step0 — Type de besoin (routage Site / Site+ERP / ERP)
export const step0Schema = z.object({
  project_type: z.enum(values(PROJECT_TYPES), { errorMap: () => ({ message: 'Sélectionnez un type de projet' }) }),
});

export type Step0Data = z.infer<typeof step0Schema>;

export const step1Schema = z
  .object({
    full_name:    z.string().min(2, 'Nom complet requis (min. 2 caractères)'),
    email:        z.string().email('Email invalide'),
    phone:        z.string().regex(phoneRe, 'Numéro invalide (10 chiffres min.)'),
    company_name: z.string().min(2, 'Nom de l\'entreprise requis').max(160),
    business_sector: z.enum(values(SECTORS), { errorMap: () => ({ message: 'Sélectionnez un secteur' }) }),
    business_sector_custom: z.string().max(160).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.business_sector === 'autre' && !data.business_sector_custom?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['business_sector_custom'], message: 'Précisez votre secteur' });
    }
  });

export const step2Schema = z
  .object({
    has_existing_site: z.enum(values(EXISTING_SITE_OPTIONS)),
    existing_site_url: z.string().url('URL invalide').optional().or(z.literal('')),
    monthly_traffic:   z.enum(values(MONTHLY_TRAFFIC)).optional(),
    main_problems:     z.array(z.enum(values(MAIN_PROBLEMS))).optional(),
    main_problems_other: z.string().max(500).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.has_existing_site === 'oui' || data.has_existing_site === 'oui_obsolete') {
      if (!data.monthly_traffic) {
        ctx.addIssue({ code: 'custom', path: ['monthly_traffic'], message: 'Trafic estimé requis' });
      }
      if (!data.main_problems || data.main_problems.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['main_problems'], message: 'Sélectionnez au moins un problème' });
      }
      if (data.main_problems?.includes('autre') && !data.main_problems_other?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['main_problems_other'], message: 'Précisez le problème' });
      }
    }
  });

export const step3Schema = z
  .object({
    main_goal:       z.enum(values(MAIN_GOALS),       { errorMap: () => ({ message: 'Sélectionnez un objectif' }) }),
    main_goal_other: z.string().max(500).optional().or(z.literal('')),
    target_audience: z.enum(values(TARGET_AUDIENCES), { errorMap: () => ({ message: 'Sélectionnez une cible' }) }),
    competitors:     z.string().max(1000).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.main_goal === 'autre' && !data.main_goal_other?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['main_goal_other'], message: 'Précisez votre objectif' });
    }
  });

export const step4Schema = z
  .object({
    desired_features:        z.array(z.enum(values(DESIRED_FEATURES))).min(1, 'Cochez au moins une option'),
    desired_features_other:  z.string().max(500).optional().or(z.literal('')),
    ecommerce_platform:      z.enum(values(ECOMMERCE_PLATFORMS)).optional(),
    ecommerce_platform_other: z.string().max(500).optional().or(z.literal('')),
    product_count_range:     z.enum(values(PRODUCT_COUNT_RANGES)).optional(),
    reservation_type:        z.enum(values(RESERVATION_TYPES)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.desired_features.includes('autre') && !data.desired_features_other?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['desired_features_other'], message: 'Précisez la fonctionnalité' });
    }
    if (data.desired_features.includes('ecommerce')) {
      if (!data.ecommerce_platform) {
        ctx.addIssue({ code: 'custom', path: ['ecommerce_platform'], message: 'Plateforme requise' });
      }
      if (data.ecommerce_platform === 'autre' && !data.ecommerce_platform_other?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['ecommerce_platform_other'], message: 'Précisez la plateforme' });
      }
      if (!data.product_count_range) {
        ctx.addIssue({ code: 'custom', path: ['product_count_range'], message: 'Volume produits requis' });
      }
    }
    if (data.desired_features.includes('reservation') && !data.reservation_type) {
      ctx.addIssue({ code: 'custom', path: ['reservation_type'], message: 'Type de réservation requis' });
    }
  });

export const step5Schema = z.object({
  has_visual_identity:        z.enum(values(BRAND_STATUS), { errorMap: () => ({ message: 'Indiquez votre situation' }) }),
  logo_file_url:              z.string().optional().nullable(),
  brand_guide_url:            z.string().optional().nullable(),
  brand_guide_external_link:  z.string().url('Lien invalide').optional().nullable().or(z.literal('')),
});

export const step6Schema = z.object({
  budget_range:     z.enum(values(BUDGET_RANGES), { errorMap: () => ({ message: 'Sélectionnez un budget' }) }),
  desired_timeline: z.enum(values(DEADLINES),     { errorMap: () => ({ message: 'Sélectionnez un délai' }) }),
});

export const step7Schema = z.object({
  is_decision_maker:         z.enum(values(DECISION_MAKERS),    { errorMap: () => ({ message: 'Indiquez le décideur' }) }),
  preferred_contact_method:  z.enum(values(PREFERRED_CONTACTS), { errorMap: () => ({ message: 'Choisissez un canal' }) }),
});

// Legacy array (compat) — équivalent à STEP_SCHEMAS_SITE sans le step0
export const STEP_SCHEMAS = [
  step1Schema, step2Schema, step3Schema, step4Schema,
  step5Schema, step6Schema, step7Schema,
] as const;

// Arrays par project_type — incluent step0 en tête
export const STEP_SCHEMAS_SITE = [
  step0Schema, step1Schema, step2Schema, step3Schema, step4Schema,
  step5Schema, step6Schema, step7Schema,
] as const;

export const STEP_SCHEMAS_ERP = [
  step0Schema, step1Schema,
  stepErp1Schema, stepErp2Schema, stepErp3Schema, stepErp4Schema,
  step6Schema, step7Schema,
] as const;

export const STEP_SCHEMAS_SITE_ERP = [
  step0Schema, step1Schema, step2Schema, step3Schema, step4Schema, step5Schema,
  stepErp1Schema, stepErp2Schema, stepErp3Schema, stepErp4Schema,
  step6Schema, step7Schema,
] as const;

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;

export type QualificationDraft = Partial<
  Step0Data & Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & Step6Data & Step7Data &
  StepErp1Data & StepErp2Data & StepErp3Data & StepErp4Data
> & {
  existing_site_screenshots?: string[];
};
