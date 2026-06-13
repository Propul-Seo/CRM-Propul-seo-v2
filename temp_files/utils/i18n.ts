/**
 * Utilitaires d'internationalisation pour l'application
 */

// Types pour les traductions
export type Locale = 'fr-FR' | 'en-US' | 'es-ES';
export type TranslationKey = string;
export type TranslationValues = Record<string, string | number>;

// Stockage des traductions
const translations: Record<Locale, Record<TranslationKey, string>> = {
  'fr-FR': {
    // Général
    'app.name': 'Propulseo CRM',
    'app.tagline': 'Gestion d\'agence SEO & Marketing Digital',
    
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.clients': 'Clients',
    'nav.tasks': 'Tâches',
    'nav.calendar': 'Calendrier',
    'nav.projects': 'Projets',
    'nav.quotes': 'Devis',
    'nav.invoices': 'Factures',
    'nav.campaigns': 'Campagnes',
    'nav.analytics': 'Analytique',
    'nav.settings': 'Paramètres',
    
    // Actions
    'action.add': 'Ajouter',
    'action.edit': 'Modifier',
    'action.delete': 'Supprimer',
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.confirm': 'Confirmer',
    'action.search': 'Rechercher',
    'action.filter': 'Filtrer',
    'action.export': 'Exporter',
    'action.import': 'Importer',
    
    // Statuts
    'status.active': 'Actif',
    'status.inactive': 'Inactif',
    'status.pending': 'En attente',
    'status.completed': 'Terminé',
    'status.cancelled': 'Annulé',
    
    // Messages
    'message.success': 'Opération réussie',
    'message.error': 'Une erreur est survenue',
    'message.loading': 'Chargement en cours...',
    'message.empty': 'Aucun élément trouvé',
    'message.confirm': 'Êtes-vous sûr de vouloir continuer ?',
    
    // Erreurs
    'error.required': 'Ce champ est requis',
    'error.email': 'Email invalide',
    'error.minLength': 'Doit contenir au moins {min} caractères',
    'error.maxLength': 'Ne doit pas dépasser {max} caractères',
    'error.invalidFormat': 'Format invalide',
    
    // Authentification
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.register': 'Inscription',
    'auth.forgotPassword': 'Mot de passe oublié',
    'auth.resetPassword': 'Réinitialiser le mot de passe',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    
    // Chat
    'chat.newMessage': 'Nouveau message',
    'chat.send': 'Envoyer',
    'chat.reply': 'Répondre',
    'chat.typing': '{user} est en train d\'écrire...',
    'chat.newGroup': 'Nouveau groupe',
    'chat.members': 'Membres',
    'chat.addMember': 'Ajouter un membre',
    'chat.leaveGroup': 'Quitter le groupe',
  },
  
  'en-US': {
    // General
    'app.name': 'Propulseo CRM',
    'app.tagline': 'SEO & Digital Marketing Agency Management',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.tasks': 'Tasks',
    'nav.calendar': 'Calendar',
    'nav.projects': 'Projects',
    'nav.quotes': 'Quotes',
    'nav.invoices': 'Invoices',
    'nav.campaigns': 'Campaigns',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    
    // Actions
    'action.add': 'Add',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.export': 'Export',
    'action.import': 'Import',
    
    // Statuses
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    
    // Messages
    'message.success': 'Operation successful',
    'message.error': 'An error occurred',
    'message.loading': 'Loading...',
    'message.empty': 'No items found',
    'message.confirm': 'Are you sure you want to continue?',
    
    // Errors
    'error.required': 'This field is required',
    'error.email': 'Invalid email',
    'error.minLength': 'Must contain at least {min} characters',
    'error.maxLength': 'Must not exceed {max} characters',
    'error.invalidFormat': 'Invalid format',
    
    // Authentication
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.forgotPassword': 'Forgot password',
    'auth.resetPassword': 'Reset password',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    
    // Chat
    'chat.newMessage': 'New message',
    'chat.send': 'Send',
    'chat.reply': 'Reply',
    'chat.typing': '{user} is typing...',
    'chat.newGroup': 'New group',
    'chat.members': 'Members',
    'chat.addMember': 'Add member',
    'chat.leaveGroup': 'Leave group',
  },
  
  'es-ES': {
    // General
    'app.name': 'Propulseo CRM',
    'app.tagline': 'Gestión de Agencia SEO y Marketing Digital',
    
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.clients': 'Clientes',
    'nav.tasks': 'Tareas',
    'nav.calendar': 'Calendario',
    'nav.projects': 'Proyectos',
    'nav.quotes': 'Presupuestos',
    'nav.invoices': 'Facturas',
    'nav.campaigns': 'Campañas',
    'nav.analytics': 'Analítica',
    'nav.settings': 'Ajustes',
    
    // Actions
    'action.add': 'Añadir',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.confirm': 'Confirmar',
    'action.search': 'Buscar',
    'action.filter': 'Filtrar',
    'action.export': 'Exportar',
    'action.import': 'Importar',
    
    // Statuses
    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'status.pending': 'Pendiente',
    'status.completed': 'Completado',
    'status.cancelled': 'Cancelado',
    
    // Messages
    'message.success': 'Operación exitosa',
    'message.error': 'Ha ocurrido un error',
    'message.loading': 'Cargando...',
    'message.empty': 'No se encontraron elementos',
    'message.confirm': '¿Está seguro de que desea continuar?',
    
    // Errors
    'error.required': 'Este campo es obligatorio',
    'error.email': 'Email inválido',
    'error.minLength': 'Debe contener al menos {min} caracteres',
    'error.maxLength': 'No debe exceder {max} caracteres',
    'error.invalidFormat': 'Formato inválido',
    
    // Authentication
    'auth.login': 'Iniciar sesión',
    'auth.logout': 'Cerrar sesión',
    'auth.register': 'Registrarse',
    'auth.forgotPassword': 'Olvidé mi contraseña',
    'auth.resetPassword': 'Restablecer contraseña',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    
    // Chat
    'chat.newMessage': 'Nuevo mensaje',
    'chat.send': 'Enviar',
    'chat.reply': 'Responder',
    'chat.typing': '{user} está escribiendo...',
    'chat.newGroup': 'Nuevo grupo',
    'chat.members': 'Miembros',
    'chat.addMember': 'Añadir miembro',
    'chat.leaveGroup': 'Salir del grupo',
  }
};

// Locale par défaut
let currentLocale: Locale = 'fr-FR';

/**
 * Définit la locale courante
 * @param locale Locale à définir
 */
export function setLocale(locale: Locale): void {
  if (translations[locale]) {
    currentLocale = locale;
  } else {
    console.warn(`Locale ${locale} not supported, falling back to fr-FR`);
  }
}

/**
 * Obtient la locale courante
 * @returns Locale courante
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Traduit une clé de traduction
 * @param key Clé de traduction
 * @param values Valeurs à insérer dans la traduction
 * @param locale Locale à utiliser (par défaut: locale courante)
 * @returns Texte traduit
 */
export function t(
  key: TranslationKey,
  values?: TranslationValues,
  locale?: Locale
): string {
  const targetLocale = locale || currentLocale;
  const translation = translations[targetLocale]?.[key] || key;
  
  if (!values) return translation;
  
  // Remplacer les variables dans la traduction
  return translation.replace(/{([^}]+)}/g, (_, name) => {
    return values[name]?.toString() || `{${name}}`;
  });
}

/**
 * Formate une date selon la locale
 * @param date Date à formater
 * @param options Options de formatage
 * @param locale Locale à utiliser (par défaut: locale courante)
 * @returns Date formatée
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale?: Locale
): string {
  const targetLocale = locale || currentLocale;
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat(targetLocale, options).format(dateObj);
}

/**
 * Formate un nombre selon la locale
 * @param number Nombre à formater
 * @param options Options de formatage
 * @param locale Locale à utiliser (par défaut: locale courante)
 * @returns Nombre formaté
 */
export function formatNumber(
  number: number,
  options?: Intl.NumberFormatOptions,
  locale?: Locale
): string {
  const targetLocale = locale || currentLocale;
  return new Intl.NumberFormat(targetLocale, options).format(number);
}

/**
 * Formate une devise selon la locale
 * @param amount Montant à formater
 * @param currency Code de devise (par défaut: EUR)
 * @param locale Locale à utiliser (par défaut: locale courante)
 * @returns Montant formaté
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale?: Locale
): string {
  return formatNumber(amount, { style: 'currency', currency }, locale);
}

/**
 * Formate une date relative (il y a X jours, etc.)
 * @param date Date à formater
 * @param locale Locale à utiliser (par défaut: locale courante)
 * @returns Date relative formatée
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale?: Locale
): string {
  const targetLocale = locale || currentLocale;
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Unités de temps en secondes
  const units = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  // Trouver l'unité appropriée
  let unit: keyof typeof units = 'second';
  let value = diffInSeconds;
  
  for (const [unitName, seconds] of Object.entries(units)) {
    if (diffInSeconds >= seconds) {
      unit = unitName as keyof typeof units;
      value = Math.floor(diffInSeconds / seconds);
      break;
    }
  }
  
  // Formater avec Intl.RelativeTimeFormat
  const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' });
  return rtf.format(-value, unit as Intl.RelativeTimeFormatUnit);
}

/**
 * Vérifie si une locale est prise en charge
 * @param locale Locale à vérifier
 * @returns true si la locale est prise en charge
 */
export function isLocaleSupported(locale: string): boolean {
  return Object.keys(translations).includes(locale);
}

/**
 * Obtient toutes les locales disponibles
 * @returns Liste des locales disponibles
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * Détecte la locale du navigateur
 * @returns Locale détectée ou locale par défaut
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'fr-FR';
  
  const browserLocale = navigator.language;
  
  // Vérifier si la locale exacte est supportée
  if (isLocaleSupported(browserLocale)) {
    return browserLocale as Locale;
  }
  
  // Vérifier si la langue principale est supportée
  const mainLanguage = browserLocale.split('-')[0];
  const matchingLocale = getAvailableLocales().find(locale => 
    locale.startsWith(mainLanguage + '-')
  );
  
  return matchingLocale || 'fr-FR';
}