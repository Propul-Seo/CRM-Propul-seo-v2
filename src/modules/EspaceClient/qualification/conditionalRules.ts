import type { QualificationDraft } from './schema';

// 13 règles conditionnelles centralisées. Chaque règle dit si un champ ou
// un sous-bloc doit s'afficher en fonction de la réponse aux questions
// pivots. Utilisées par les step components ET par le RecapAccordion.

export const conditionalRules = {
  // Étape 2 — montre URL + trafic + problèmes si oui/obsolète
  showExistingSiteDetails: (d: QualificationDraft): boolean =>
    d.has_existing_site === 'oui' || d.has_existing_site === 'oui_obsolete',

  // Étape 4 — montre plateforme + volume si e-commerce coché
  showEcommerceDetails: (d: QualificationDraft): boolean =>
    Array.isArray(d.desired_features) && d.desired_features.includes('ecommerce'),

  // Étape 4 — montre type de réservation si réservation en ligne cochée
  showReservationDetails: (d: QualificationDraft): boolean =>
    Array.isArray(d.desired_features) && d.desired_features.includes('reservation'),

  // Étape 5 — montre upload logo si charte complète OU juste logo
  showLogoUpload: (d: QualificationDraft): boolean =>
    d.has_visual_identity === 'charte_complete' || d.has_visual_identity === 'juste_logo',

  // Étape 5 — montre upload charte PDF uniquement si charte complète
  showBrandGuideUpload: (d: QualificationDraft): boolean =>
    d.has_visual_identity === 'charte_complete',

  // Étape 2 — toute la step est skip si "non, pas encore"
  shouldSkipStep2Body: (d: QualificationDraft): boolean =>
    d.has_existing_site === 'non',
} as const;

// Reset des champs orphelins quand une branche se ferme. Évite de garder
// des valeurs invisibles qui seraient envoyées par erreur à la soumission.
// Retourne la draft modifiée (non muté).
export function resetOrphanFields(prev: QualificationDraft, next: QualificationDraft): QualificationDraft {
  const out = { ...next };

  // Étape 2 : si has_existing_site = 'non', reset URL/trafic/problèmes/screenshots/_other
  if (next.has_existing_site === 'non' && prev.has_existing_site !== 'non') {
    out.existing_site_url = '';
    out.monthly_traffic = undefined;
    out.main_problems = [];
    out.main_problems_other = '';
    out.existing_site_screenshots = [];
  }

  // Étape 2 : si "autre" retiré de main_problems → clear le champ texte associé
  const hadOtherProblem = Array.isArray(prev.main_problems) && prev.main_problems.includes('autre');
  const hasOtherProblem = Array.isArray(next.main_problems) && next.main_problems.includes('autre');
  if (hadOtherProblem && !hasOtherProblem) {
    out.main_problems_other = '';
  }

  // Étape 3 : si main_goal change et n'est plus 'autre' → clear le champ texte associé
  if (prev.main_goal === 'autre' && next.main_goal !== 'autre') {
    out.main_goal_other = '';
  }

  // Étape 4 : si e-commerce décoché, reset plateforme/volume/_other
  const ecomBefore = Array.isArray(prev.desired_features) && prev.desired_features.includes('ecommerce');
  const ecomAfter  = Array.isArray(next.desired_features) && next.desired_features.includes('ecommerce');
  if (ecomBefore && !ecomAfter) {
    out.ecommerce_platform = undefined;
    out.product_count_range = undefined;
    out.ecommerce_platform_other = '';
  }

  // Étape 4 : si réservation décochée, reset reservation_type
  const reservBefore = Array.isArray(prev.desired_features) && prev.desired_features.includes('reservation');
  const reservAfter  = Array.isArray(next.desired_features) && next.desired_features.includes('reservation');
  if (reservBefore && !reservAfter) {
    out.reservation_type = undefined;
  }

  // Étape 4 : si 'autre' retiré de desired_features → clear le champ texte associé
  const hadOtherFeature = Array.isArray(prev.desired_features) && prev.desired_features.includes('autre');
  const hasOtherFeature = Array.isArray(next.desired_features) && next.desired_features.includes('autre');
  if (hadOtherFeature && !hasOtherFeature) {
    out.desired_features_other = '';
  }

  // Étape 4 : si ecommerce_platform change et n'est plus 'autre' → clear le champ texte associé
  if (prev.ecommerce_platform === 'autre' && next.ecommerce_platform !== 'autre') {
    out.ecommerce_platform_other = '';
  }

  // Étape 5 : si visual identity change, reset les fichiers liés + le lien externe
  if (prev.has_visual_identity !== next.has_visual_identity) {
    if (next.has_visual_identity === 'rien_du_tout') {
      out.logo_file_url = null;
      out.brand_guide_url = null;
      out.brand_guide_external_link = '';
    }
    if (next.has_visual_identity === 'juste_logo') {
      out.brand_guide_url = null;
      out.brand_guide_external_link = '';
    }
  }

  return out;
}
