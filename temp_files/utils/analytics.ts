/**
 * Utilitaires d'analytique pour l'application
 */

// Types pour les événements d'analytique
export type AnalyticsEventType = 
  | 'page_view'
  | 'user_action'
  | 'form_submit'
  | 'error'
  | 'performance'
  | 'feature_usage';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

// Configuration globale
let analyticsEnabled = true;
let userId: string | null = null;
let sessionId: string | null = null;

/**
 * Initialise le service d'analytique
 * @param options Options d'initialisation
 */
export function initAnalytics(options: {
  enabled?: boolean;
  userId?: string;
}): void {
  analyticsEnabled = options.enabled ?? true;
  userId = options.userId || null;
  sessionId = generateSessionId();
  
  // Enregistrer la session
  if (analyticsEnabled) {
    trackEvent({
      type: 'page_view',
      name: 'session_start',
      properties: {
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }
    });
  }
}

/**
 * Génère un ID de session unique
 * @returns ID de session
 */
function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Enregistre un événement d'analytique
 * @param event Événement à enregistrer
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!analyticsEnabled) return;
  
  const enrichedEvent = {
    ...event,
    timestamp: event.timestamp || Date.now(),
    properties: {
      ...event.properties,
      userId,
      sessionId,
      url: window.location.href,
    }
  };
  
  // En environnement de développement, on log les événements
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', enrichedEvent);
  }
  
  // Dans une vraie application, on enverrait les données à un service d'analytique
  // sendToAnalyticsService(enrichedEvent);
}

/**
 * Enregistre une vue de page
 * @param pageName Nom de la page
 * @param properties Propriétés additionnelles
 */
export function trackPageView(pageName: string, properties?: Record<string, any>): void {
  trackEvent({
    type: 'page_view',
    name: pageName,
    properties
  });
}

/**
 * Enregistre une action utilisateur
 * @param actionName Nom de l'action
 * @param properties Propriétés additionnelles
 */
export function trackUserAction(actionName: string, properties?: Record<string, any>): void {
  trackEvent({
    type: 'user_action',
    name: actionName,
    properties
  });
}

/**
 * Enregistre une soumission de formulaire
 * @param formName Nom du formulaire
 * @param properties Propriétés additionnelles
 */
export function trackFormSubmit(formName: string, properties?: Record<string, any>): void {
  trackEvent({
    type: 'form_submit',
    name: formName,
    properties
  });
}

/**
 * Enregistre une erreur
 * @param errorName Nom de l'erreur
 * @param properties Propriétés additionnelles
 */
export function trackError(errorName: string, properties?: Record<string, any>): void {
  trackEvent({
    type: 'error',
    name: errorName,
    properties
  });
}

/**
 * Enregistre une métrique de performance
 * @param metricName Nom de la métrique
 * @param value Valeur de la métrique
 * @param properties Propriétés additionnelles
 */
export function trackPerformance(
  metricName: string,
  value: number,
  properties?: Record<string, any>
): void {
  trackEvent({
    type: 'performance',
    name: metricName,
    properties: {
      ...properties,
      value
    }
  });
}

/**
 * Enregistre l'utilisation d'une fonctionnalité
 * @param featureName Nom de la fonctionnalité
 * @param properties Propriétés additionnelles
 */
export function trackFeatureUsage(featureName: string, properties?: Record<string, any>): void {
  trackEvent({
    type: 'feature_usage',
    name: featureName,
    properties
  });
}

/**
 * Définit l'ID utilisateur pour l'analytique
 * @param newUserId Nouvel ID utilisateur
 */
export function setUserId(newUserId: string | null): void {
  userId = newUserId;
}

/**
 * Active ou désactive l'analytique
 * @param enabled true pour activer, false pour désactiver
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  analyticsEnabled = enabled;
}

/**
 * Mesure le temps d'exécution d'une fonction et enregistre la performance
 * @param name Nom de la mesure
 * @param func Fonction à mesurer
 * @returns Résultat de la fonction
 */
export function measureAndTrack<T>(name: string, func: () => T): T {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  
  trackPerformance(name, end - start);
  return result;
}