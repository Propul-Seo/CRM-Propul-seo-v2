import { adminRpc } from './adminRpc';

// Template des jalons types appliqué aux nouveaux projets depuis le cockpit.
// Stocké en base (propulspace.app_settings, clé ci-dessous) pour être partagé
// entre admins et éditable dans les Réglages du back-office ; tant que rien
// n'est enregistré (ou si la mig 300 n'est pas appliquée), on sert les défauts.

export interface StepTemplateItem {
  label: string;
  description: string;
}

export const STEP_TEMPLATE_KEY = 'project_step_template';

export const DEFAULT_STEP_TEMPLATE: StepTemplateItem[] = [
  { label: 'Lancement & cadrage', description: 'Brief validé, objectifs et planning posés.' },
  { label: 'Maquettes & design', description: 'Direction artistique et maquettes des pages clés.' },
  { label: 'Développement', description: 'Intégration et développement des fonctionnalités.' },
  { label: 'Recette & corrections', description: 'Tests, vos retours et ajustements avant lancement.' },
  { label: 'Mise en ligne', description: 'Déploiement, nom de domaine et derniers contrôles.' },
  { label: 'Suivi & optimisations', description: 'Accompagnement et améliorations après le lancement.' },
];

function isTemplateItem(v: unknown): v is StepTemplateItem {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.label === 'string' && o.label.trim() !== '' && typeof o.description === 'string';
}

export interface LoadedStepTemplate {
  items: StepTemplateItem[];
  /** true si on sert les défauts (rien d'enregistré, ou setting illisible). */
  isDefault: boolean;
  /** Erreur RPC (ex. mig 300 non appliquée) — informative, jamais bloquante. */
  error: string | null;
}

export async function loadStepTemplate(): Promise<LoadedStepTemplate> {
  const { data, error } = await adminRpc('admin_get_setting', { p_key: STEP_TEMPLATE_KEY });
  if (error) return { items: DEFAULT_STEP_TEMPLATE, isDefault: true, error: error.message };
  if (!Array.isArray(data)) return { items: DEFAULT_STEP_TEMPLATE, isDefault: true, error: null };
  const items = data.filter(isTemplateItem);
  if (items.length === 0) return { items: DEFAULT_STEP_TEMPLATE, isDefault: true, error: null };
  return { items, isDefault: false, error: null };
}

export async function saveStepTemplate(items: StepTemplateItem[]): Promise<{ error: string | null }> {
  const cleaned = items
    .map(i => ({ label: i.label.trim(), description: i.description.trim() }))
    .filter(i => i.label !== '');
  if (cleaned.length === 0) return { error: 'Le template doit contenir au moins un jalon.' };
  const { error } = await adminRpc('admin_set_setting', { p_key: STEP_TEMPLATE_KEY, p_value: cleaned });
  return { error: error ? error.message : null };
}
