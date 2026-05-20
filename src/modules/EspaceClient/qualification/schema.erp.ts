// Schemas Zod ERP-spécifiques (migration 242).
// 4 steps : système actuel, modules, utilisateurs/SSO, intégrations.

import { z } from 'zod';
import {
  ERP_CURRENT_SYSTEMS, ERP_DATA_VOLUMES, ERP_MODULES,
  ERP_USERS_COUNT, ERP_SSO_TYPES, ERP_INTEGRATIONS,
} from './constants.erp';

const values = <T extends ReadonlyArray<{ value: string }>>(arr: T): [string, ...string[]] => {
  const vals = arr.map(o => o.value);
  return [vals[0], ...vals.slice(1)];
};

// StepErp1 — Système actuel + volume données
export const stepErp1Schema = z
  .object({
    erp_current_system:       z.enum(values(ERP_CURRENT_SYSTEMS), { errorMap: () => ({ message: 'Sélectionnez votre système actuel' }) }),
    erp_current_system_other: z.string().max(500).optional().or(z.literal('')),
    erp_data_volume:          z.enum(values(ERP_DATA_VOLUMES),    { errorMap: () => ({ message: 'Indiquez le volume de données' }) }),
  })
  .superRefine((data, ctx) => {
    if (data.erp_current_system === 'autre' && !data.erp_current_system_other?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['erp_current_system_other'], message: 'Précisez votre système' });
    }
  });

// StepErp2 — Modules nécessaires (multi-select)
export const stepErp2Schema = z
  .object({
    erp_modules:       z.array(z.enum(values(ERP_MODULES))).min(1, 'Cochez au moins un module'),
    erp_modules_other: z.string().max(500).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.erp_modules.includes('autre') && !data.erp_modules_other?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['erp_modules_other'], message: 'Précisez le module' });
    }
  });

// StepErp3 — Utilisateurs + mobile + SSO
export const stepErp3Schema = z.object({
  erp_users_count:     z.enum(values(ERP_USERS_COUNT),  { errorMap: () => ({ message: 'Sélectionnez le nombre d\'utilisateurs' }) }),
  erp_mobile_required: z.boolean({ required_error: 'Indiquez si l\'accès mobile est nécessaire' }),
  erp_sso_type:        z.enum(values(ERP_SSO_TYPES),    { errorMap: () => ({ message: 'Sélectionnez un type de connexion' }) }),
});

// StepErp4 — Intégrations souhaitées (multi-select)
export const stepErp4Schema = z
  .object({
    erp_integrations:       z.array(z.enum(values(ERP_INTEGRATIONS))).optional(),
    erp_integrations_other: z.string().max(500).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.erp_integrations?.includes('autre') && !data.erp_integrations_other?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['erp_integrations_other'], message: 'Précisez l\'intégration' });
    }
  });

export type StepErp1Data = z.infer<typeof stepErp1Schema>;
export type StepErp2Data = z.infer<typeof stepErp2Schema>;
export type StepErp3Data = z.infer<typeof stepErp3Schema>;
export type StepErp4Data = z.infer<typeof stepErp4Schema>;
