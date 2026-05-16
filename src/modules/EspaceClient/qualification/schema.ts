import { z } from 'zod';
import {
  SECTORS, EXISTING_SITE_OPTIONS, MONTHLY_TRAFFIC, MAIN_PROBLEMS,
  MAIN_GOALS, TARGET_AUDIENCES, DESIRED_FEATURES, ECOMMERCE_PLATFORMS,
  PRODUCT_COUNT_RANGES, BRAND_STATUS, BUDGET_RANGES, DEADLINES,
  DECISION_MAKERS, PREFERRED_CONTACTS,
} from './constants';

const values = <T extends ReadonlyArray<{ value: string }>>(arr: T): [string, ...string[]] => {
  const vals = arr.map(o => o.value);
  return [vals[0], ...vals.slice(1)];
};

// Validation téléphone : 10+ chiffres, accepte espaces/points/tirets/+
const phoneRe = /^[+\d][\d\s.\-()]{8,}$/;

export const step1Schema = z.object({
  full_name:    z.string().min(2, 'Nom complet requis (min. 2 caractères)'),
  email:        z.string().email('Email invalide'),
  phone:        z.string().regex(phoneRe, 'Numéro invalide (10 chiffres min.)'),
  company_name: z.string().max(160).optional().or(z.literal('')),
  business_sector: z.enum(values(SECTORS), { errorMap: () => ({ message: 'Sélectionnez un secteur' }) }),
});

export const step2Schema = z
  .object({
    has_existing_site: z.enum(values(EXISTING_SITE_OPTIONS)),
    existing_site_url: z.string().url('URL invalide').optional().or(z.literal('')),
    monthly_traffic:   z.enum(values(MONTHLY_TRAFFIC)).optional(),
    main_problems:     z.array(z.enum(values(MAIN_PROBLEMS))).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.has_existing_site === 'oui' || data.has_existing_site === 'oui_obsolete') {
      if (!data.existing_site_url) {
        ctx.addIssue({ code: 'custom', path: ['existing_site_url'], message: 'URL du site requise' });
      }
      if (!data.monthly_traffic) {
        ctx.addIssue({ code: 'custom', path: ['monthly_traffic'], message: 'Trafic estimé requis' });
      }
      if (!data.main_problems || data.main_problems.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['main_problems'], message: 'Sélectionnez au moins un problème' });
      }
    }
  });

export const step3Schema = z.object({
  main_goal:       z.enum(values(MAIN_GOALS),       { errorMap: () => ({ message: 'Sélectionnez un objectif' }) }),
  target_audience: z.enum(values(TARGET_AUDIENCES), { errorMap: () => ({ message: 'Sélectionnez une cible' }) }),
  competitors:     z.string().max(1000).optional().or(z.literal('')),
});

export const step4Schema = z
  .object({
    desired_features:    z.array(z.enum(values(DESIRED_FEATURES))).min(1, 'Cochez au moins une option'),
    ecommerce_platform:  z.enum(values(ECOMMERCE_PLATFORMS)).optional(),
    product_count_range: z.enum(values(PRODUCT_COUNT_RANGES)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.desired_features.includes('ecommerce')) {
      if (!data.ecommerce_platform) {
        ctx.addIssue({ code: 'custom', path: ['ecommerce_platform'], message: 'Plateforme requise' });
      }
      if (!data.product_count_range) {
        ctx.addIssue({ code: 'custom', path: ['product_count_range'], message: 'Volume produits requis' });
      }
    }
  });

export const step5Schema = z
  .object({
    has_visual_identity: z.enum(values(BRAND_STATUS), { errorMap: () => ({ message: 'Indiquez votre situation' }) }),
    logo_file_url:       z.string().optional().nullable(),
    brand_guide_url:     z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.has_visual_identity === 'charte_complete') {
      if (!data.logo_file_url)   ctx.addIssue({ code: 'custom', path: ['logo_file_url'],   message: 'Logo requis' });
      if (!data.brand_guide_url) ctx.addIssue({ code: 'custom', path: ['brand_guide_url'], message: 'Charte PDF requise' });
    }
    if (data.has_visual_identity === 'juste_logo' && !data.logo_file_url) {
      ctx.addIssue({ code: 'custom', path: ['logo_file_url'], message: 'Logo requis' });
    }
  });

export const step6Schema = z.object({
  budget_range:     z.enum(values(BUDGET_RANGES), { errorMap: () => ({ message: 'Sélectionnez un budget' }) }),
  desired_timeline: z.enum(values(DEADLINES),     { errorMap: () => ({ message: 'Sélectionnez un délai' }) }),
});

export const step7Schema = z.object({
  is_decision_maker:         z.enum(values(DECISION_MAKERS),    { errorMap: () => ({ message: 'Indiquez le décideur' }) }),
  preferred_contact_method:  z.enum(values(PREFERRED_CONTACTS), { errorMap: () => ({ message: 'Choisissez un canal' }) }),
});

export const STEP_SCHEMAS = [
  step1Schema, step2Schema, step3Schema, step4Schema,
  step5Schema, step6Schema, step7Schema,
] as const;

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;

export type QualificationDraft = Partial<
  Step1Data & Step2Data & Step3Data & Step4Data & Step5Data & Step6Data & Step7Data
> & {
  existing_site_screenshots?: string[];
};
