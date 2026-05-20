// Construction des sections du récap final selon le project_type.
// Site → 6 sections classiques. ERP → 4 sections. Site+ERP → toutes.

import type { QualificationDraft } from '../schema';
import {
  SECTORS, EXISTING_SITE_OPTIONS, MONTHLY_TRAFFIC, MAIN_PROBLEMS,
  MAIN_GOALS, TARGET_AUDIENCES, DESIRED_FEATURES, ECOMMERCE_PLATFORMS,
  PRODUCT_COUNT_RANGES, BRAND_STATUS, BUDGET_RANGES, DEADLINES,
  RESERVATION_TYPES, PROJECT_TYPES,
} from '../constants';
import {
  ERP_CURRENT_SYSTEMS, ERP_DATA_VOLUMES, ERP_MODULES,
  ERP_USERS_COUNT, ERP_SSO_TYPES, ERP_INTEGRATIONS,
} from '../constants.erp';

export interface Section {
  num: number;
  title: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
}

type ListConst = ReadonlyArray<{ value: string; label: string }>;

function labelOf(arr: ListConst, v: string | undefined): string {
  if (!v) return '—';
  return arr.find(o => o.value === v)?.label ?? v;
}

function labelsOfMany(arr: ListConst, vs: string[] | undefined): string {
  if (!vs || vs.length === 0) return '—';
  return vs.map(v => arr.find(o => o.value === v)?.label ?? v).join(', ');
}

function withOther(
  base: Array<{ label: string; value: string }>,
  label: string,
  value: string | null | undefined,
): Array<{ label: string; value: string }> {
  if (!value?.trim()) return base;
  return [...base, { label, value: value.trim() }];
}

const sIdentity = (d: QualificationDraft, num: number): Section => ({
  num,
  title: 'Votre besoin & identité',
  summary: [labelOf(PROJECT_TYPES, d.project_type), d.full_name, d.company_name].filter(Boolean).join(' · ') || '—',
  details: withOther([
    { label: 'Type de projet', value: labelOf(PROJECT_TYPES, d.project_type) },
    { label: 'Nom complet',    value: d.full_name ?? '—' },
    { label: 'Email',          value: d.email ?? '—' },
    { label: 'Téléphone',      value: d.phone ?? '—' },
    { label: 'Entreprise',     value: d.company_name ?? '—' },
    { label: 'Secteur',        value: labelOf(SECTORS, d.business_sector) },
  ], 'Précision secteur', d.business_sector_custom),
});

const sSituation = (d: QualificationDraft, num: number): Section => ({
  num, title: 'Situation site actuelle',
  summary: labelOf(EXISTING_SITE_OPTIONS, d.has_existing_site),
  details: withOther([
    { label: 'Site existant', value: labelOf(EXISTING_SITE_OPTIONS, d.has_existing_site) },
    { label: 'URL',           value: d.existing_site_url ?? '—' },
    { label: 'Trafic',        value: labelOf(MONTHLY_TRAFFIC, d.monthly_traffic) },
    { label: 'Problèmes',     value: labelsOfMany(MAIN_PROBLEMS, d.main_problems) },
    { label: 'Captures',      value: `${d.existing_site_screenshots?.length ?? 0} fichier(s)` },
  ], 'Précision problème', d.main_problems_other),
});

const sObjectives = (d: QualificationDraft, num: number): Section => ({
  num, title: 'Objectifs',
  summary: [labelOf(MAIN_GOALS, d.main_goal), labelOf(TARGET_AUDIENCES, d.target_audience)].filter(s => s !== '—').join(' · ') || '—',
  details: withOther([
    { label: 'Objectif principal', value: labelOf(MAIN_GOALS, d.main_goal) },
    { label: 'Cible',              value: labelOf(TARGET_AUDIENCES, d.target_audience) },
    { label: 'Concurrents',        value: d.competitors ?? '—' },
  ], 'Précision objectif', d.main_goal_other),
});

const sFeatures = (d: QualificationDraft, num: number): Section => {
  const base: Array<{ label: string; value: string }> = [
    { label: 'Fonctionnalités', value: labelsOfMany(DESIRED_FEATURES, d.desired_features) },
  ];
  if (d.desired_features?.includes('ecommerce')) {
    base.push(
      { label: 'Plateforme e-com', value: labelOf(ECOMMERCE_PLATFORMS, d.ecommerce_platform) },
      { label: 'Volume produits',  value: labelOf(PRODUCT_COUNT_RANGES, d.product_count_range) },
    );
  }
  if (d.desired_features?.includes('reservation')) {
    base.push({ label: 'Type réservation', value: labelOf(RESERVATION_TYPES, d.reservation_type) });
  }
  return {
    num, title: 'Fonctionnalités site',
    summary: labelsOfMany(DESIRED_FEATURES, d.desired_features),
    details: withOther(
      withOther(base, 'Précision fonctionnalité', d.desired_features_other),
      'Précision plateforme', d.ecommerce_platform_other,
    ),
  };
};

const sBrand = (d: QualificationDraft, num: number): Section => ({
  num, title: 'Identité visuelle',
  summary: labelOf(BRAND_STATUS, d.has_visual_identity),
  details: [
    { label: 'Situation',   value: labelOf(BRAND_STATUS, d.has_visual_identity) },
    { label: 'Logo fourni', value: d.logo_file_url ? 'Oui' : 'Non' },
    {
      label: 'Charte fournie',
      value: d.brand_guide_url ? 'Oui (upload)'
        : d.brand_guide_external_link ? `Lien : ${d.brand_guide_external_link}` : 'Non',
    },
  ],
});

const sErpSystem = (d: QualificationDraft, num: number): Section => ({
  num, title: 'ERP — Système actuel',
  summary: [labelOf(ERP_CURRENT_SYSTEMS, d.erp_current_system), labelOf(ERP_DATA_VOLUMES, d.erp_data_volume)].filter(s => s !== '—').join(' · ') || '—',
  details: withOther([
    { label: 'Système actuel',  value: labelOf(ERP_CURRENT_SYSTEMS, d.erp_current_system) },
    { label: 'Volume données',  value: labelOf(ERP_DATA_VOLUMES, d.erp_data_volume) },
  ], 'Précision système', d.erp_current_system_other),
});

const sErpModules = (d: QualificationDraft, num: number): Section => ({
  num, title: 'ERP — Modules',
  summary: labelsOfMany(ERP_MODULES, d.erp_modules),
  details: withOther([
    { label: 'Modules', value: labelsOfMany(ERP_MODULES, d.erp_modules) },
  ], 'Précision module', d.erp_modules_other),
});

const sErpUsers = (d: QualificationDraft, num: number): Section => ({
  num, title: 'ERP — Utilisateurs & accès',
  summary: [labelOf(ERP_USERS_COUNT, d.erp_users_count), labelOf(ERP_SSO_TYPES, d.erp_sso_type)].filter(s => s !== '—').join(' · ') || '—',
  details: [
    { label: 'Nombre utilisateurs', value: labelOf(ERP_USERS_COUNT, d.erp_users_count) },
    { label: 'Accès mobile',        value: d.erp_mobile_required === true ? 'Oui' : d.erp_mobile_required === false ? 'Non' : '—' },
    { label: 'Mode connexion',      value: labelOf(ERP_SSO_TYPES, d.erp_sso_type) },
  ],
});

const sErpIntegrations = (d: QualificationDraft, num: number): Section => ({
  num, title: 'ERP — Intégrations',
  summary: labelsOfMany(ERP_INTEGRATIONS, d.erp_integrations),
  details: withOther([
    { label: 'Intégrations souhaitées', value: labelsOfMany(ERP_INTEGRATIONS, d.erp_integrations) },
  ], 'Précision intégration', d.erp_integrations_other),
});

const sBudget = (d: QualificationDraft, num: number): Section => ({
  num, title: 'Budget & délais',
  summary: [labelOf(BUDGET_RANGES, d.budget_range), labelOf(DEADLINES, d.desired_timeline)].filter(s => s !== '—').join(' · ') || '—',
  details: [
    { label: 'Budget', value: labelOf(BUDGET_RANGES, d.budget_range) },
    { label: 'Délai',  value: labelOf(DEADLINES, d.desired_timeline) },
  ],
});

export function buildSections(d: QualificationDraft): Section[] {
  const t = d.project_type ?? 'site';
  let i = 0;
  const out: Section[] = [sIdentity(d, ++i)];

  if (t === 'site' || t === 'site_erp') {
    out.push(sSituation(d, ++i), sObjectives(d, ++i), sFeatures(d, ++i), sBrand(d, ++i));
  } else if (t === 'erp') {
    out.push(sObjectives(d, ++i));
  }
  if (t === 'erp' || t === 'site_erp') {
    out.push(sErpSystem(d, ++i), sErpModules(d, ++i), sErpUsers(d, ++i), sErpIntegrations(d, ++i));
  }
  out.push(sBudget(d, ++i));
  return out;
}
