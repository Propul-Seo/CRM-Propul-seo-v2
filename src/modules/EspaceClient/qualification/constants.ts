// Options des radio/checkbox cards du questionnaire de qualification.
// Les `value` sont les énumérations stockées en DB (cf CHECK constraints
// ou conventions Phase 1). Les `label` sont l'UI FR.

// Total steps dépend du project_type — voir getTotalSteps()
export const QUALIF_TOTAL_STEPS_SITE = 8;        // Step0 type + 7 steps site
export const QUALIF_TOTAL_STEPS_ERP = 7;         // Step0 type + 4 steps ERP + budget + décideur (skip 1)
export const QUALIF_TOTAL_STEPS_SITE_ERP = 12;   // Step0 + 7 site + 4 ERP - budget/décideur partagés
export const QUALIF_TOTAL_STEPS = QUALIF_TOTAL_STEPS_SITE; // legacy fallback

export const PROJECT_TYPES = [
  { value: 'site',     label: 'Site web',          hint: 'Vitrine, e-commerce, réservation, blog…' },
  { value: 'site_erp', label: 'Site web + ERP',    hint: 'J\'ai besoin des deux à la fois' },
  { value: 'erp',      label: 'ERP / Outil métier', hint: 'Gestion interne : clients, stock, facturation, planning…' },
] as const;

export const SECTORS = [
  { value: 'ecommerce',                label: 'E-commerce' },
  { value: 'restaurant_hotellerie',    label: 'Restaurant / Hôtellerie' },
  { value: 'joaillerie_artisanat',     label: 'Joaillerie / Artisanat haut de gamme' },
  { value: 'diagnostic_audit',         label: 'Diagnostic / Audit' },
  { value: 'immobilier_syndic',        label: 'Immobilier / Syndic' },
  { value: 'sante_bienetre',           label: 'Santé / Bien-être' },
  { value: 'profession_liberale',      label: 'Profession libérale' },
  { value: 'startup_tech',             label: 'Startup Tech / SaaS' },
  { value: 'artisan_commerce_local',   label: 'Artisan / Commerce local' },
  { value: 'autre',                    label: 'Autre' },
] as const;

export const EXISTING_SITE_OPTIONS = [
  { value: 'oui',          label: 'Oui',                     hint: 'Il est encore d\'actualité' },
  { value: 'oui_obsolete', label: 'Oui, mais obsolète',      hint: 'Il a besoin d\'une refonte' },
  { value: 'non',          label: 'Non, pas encore',         hint: 'Je pars de zéro' },
] as const;

export const MONTHLY_TRAFFIC = [
  { value: '<500',          label: '< 500 visiteurs / mois' },
  { value: '500-2000',      label: '500 – 2 000' },
  { value: '>2000',         label: '> 2 000' },
  { value: 'je_ne_sais_pas',label: 'Je ne sais pas' },
] as const;

export const MAIN_PROBLEMS = [
  { value: 'design_depasse',  label: 'Design dépassé' },
  { value: 'pas_mobile',      label: 'Pas adapté mobile' },
  { value: 'trop_lent',       label: 'Trop lent' },
  { value: 'mal_reference',   label: 'Mal référencé' },
  { value: 'autre',           label: 'Autre' },
] as const;

export const MAIN_GOALS = [
  { value: 'presenter_services', label: 'Présenter mes services' },
  { value: 'vendre_en_ligne',    label: 'Vendre en ligne' },
  { value: 'generer_leads',      label: 'Générer des leads' },
  { value: 'refondre_image',     label: 'Refondre mon image' },
  { value: 'autre',              label: 'Autre' },
] as const;

export const TARGET_AUDIENCES = [
  { value: 'b2c',      label: 'Particuliers (B2C)' },
  { value: 'b2b',      label: 'Professionnels (B2B)' },
  { value: 'les_deux', label: 'Les deux' },
] as const;

export const DESIRED_FEATURES = [
  { value: 'blog',           label: 'Blog / Actualités' },
  { value: 'ecommerce',      label: 'E-commerce (vente en ligne)' },
  { value: 'reservation',    label: 'Réservation en ligne' },
  { value: 'espace_membre',  label: 'Espace membre / client' },
  { value: 'chat',           label: 'Chat en ligne' },
  { value: 'multi_langue',   label: 'Multi-langue' },
  { value: 'seo_avance',     label: 'SEO avancé' },
  { value: 'dashboard',      label: 'Dashboard' },
  { value: 'autre',          label: 'Autre' },
] as const;

export const RESERVATION_TYPES = [
  { value: 'restaurant',          label: 'Restaurant / table',    hint: 'Créneaux par service, nombre de couverts' },
  { value: 'hebergement',         label: 'Hébergement / nuit',    hint: 'Nuitées, occupation chambres' },
  { value: 'rdv_professionnel',   label: 'RDV professionnel',     hint: 'Créneaux de 30 min à 1h (type Calendly)' },
  { value: 'evenement_billet',    label: 'Événement / billetterie', hint: 'Places, sessions, dates fixes' },
  { value: 'autre',               label: 'Autre',                 hint: 'Précisez votre cas' },
] as const;

export const ECOMMERCE_PLATFORMS = [
  { value: 'shopify',     label: 'Shopify' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'prestashop',  label: 'PrestaShop' },
  { value: 'aucune',      label: 'Aucune' },
  { value: 'autre',       label: 'Autre' },
] as const;

export const PRODUCT_COUNT_RANGES = [
  { value: '<50',     label: '< 50' },
  { value: '50-500',  label: '50 – 500' },
  { value: '>500',    label: '> 500' },
] as const;

export const BRAND_STATUS = [
  { value: 'charte_complete', label: 'Charte complète', hint: 'Logo + couleurs + typo' },
  { value: 'juste_logo',      label: 'Juste un logo',   hint: 'Pas de charte complète' },
  { value: 'rien_du_tout',    label: 'Rien du tout',    hint: 'On part de zéro' },
] as const;

export const BUDGET_RANGES = [
  { value: '<2000',         label: '< 2 000 €',          emoji: '💡' },
  { value: '2000-5000',     label: '2 000 – 5 000 €',    emoji: '🚀' },
  { value: '5000-10000',    label: '5 000 – 10 000 €',   emoji: '⭐' },
  { value: '10000-20000',   label: '10 000 – 20 000 €',  emoji: '💎' },
  { value: '>20000',        label: '> 20 000 €',         emoji: '🏆' },
] as const;

export const DEADLINES = [
  { value: '<1mois',        label: '< 1 mois' },
  { value: '1-3mois',       label: '1 – 3 mois' },
  { value: '3-6mois',       label: '3 – 6 mois' },
  { value: 'pas_de_deadline', label: 'Pas de deadline' },
] as const;

export const DECISION_MAKERS = [
  { value: 'seul',           label: 'Je décide seul·e' },
  { value: 'avec_associes',  label: 'Avec mes associés' },
  { value: 'fais_remonter',  label: 'Je fais remonter' },
] as const;

export const PREFERRED_CONTACTS = [
  { value: 'telephone', label: 'Par téléphone' },
  { value: 'whatsapp',  label: 'Par WhatsApp' },
  { value: 'email',     label: 'Par email' },
] as const;

// ERP enums déplacés dans ./constants.erp.ts (règle 200 lignes max).
export {
  ERP_CURRENT_SYSTEMS, ERP_DATA_VOLUMES, ERP_MODULES,
  ERP_USERS_COUNT, ERP_SSO_TYPES, ERP_INTEGRATIONS,
} from './constants.erp';

// Sprint A.3.1 — l'ancienne clé localStorage (id de row, publique) est remplacée
// par un draft_session_token UUID secret stocké en sessionStorage.
// L'ancienne clé est purgée silencieusement au mount du hook.
export const QUALIFICATION_SESSION_LOCALSTORAGE_KEY = 'propulseo_qualification_session_id';
export const QUALIFICATION_TOKEN_SESSIONSTORAGE_KEY = 'propulseo_qualification_session_token';
export const QUALIFICATION_STORAGE_BUCKET = 'propulspace-uploads';
export const QUALIFICATION_STORAGE_FOLDER = 'qualification';

export const FILE_UPLOAD_LIMITS = {
  screenshots: { maxFiles: 3, maxSizeMb: 25, accept: 'image/png,image/jpeg,image/webp' },
  logo:        { maxFiles: 1, maxSizeMb: 10, accept: 'image/svg+xml,image/png,image/jpeg,.ai' },
  brandGuide:  { maxFiles: 1, maxSizeMb: 25, accept: 'application/pdf,image/*,application/zip,application/postscript,.sketch,.fig,.ai' },
} as const;
