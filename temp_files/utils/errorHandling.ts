/**
 * Utilitaires de gestion d'erreurs pour l'application
 */
import { toast } from 'sonner';
import { trackError } from './analytics';

// Types d'erreurs
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

// Interface pour les erreurs structurées
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  originalError?: any;
}

/**
 * Crée une erreur structurée
 * @param type Type d'erreur
 * @param message Message d'erreur
 * @param details Détails supplémentaires
 * @returns Erreur structurée
 */
export function createError(
  type: ErrorType,
  message: string,
  details?: {
    code?: string;
    originalError?: any;
    [key: string]: any;
  }
): AppError {
  return {
    type,
    message,
    code: details?.code,
    details: details,
    originalError: details?.originalError
  };
}

/**
 * Gère une erreur de manière centralisée
 * @param error Erreur à gérer
 * @param options Options de gestion
 */
export function handleError(
  error: any,
  options: {
    showToast?: boolean;
    logToConsole?: boolean;
    trackAnalytics?: boolean;
    context?: string;
  } = {}
): AppError {
  const {
    showToast = true,
    logToConsole = true,
    trackAnalytics = true,
    context = 'application'
  } = options;
  
  // Normaliser l'erreur
  const appError = normalizeError(error);
  
  // Journaliser l'erreur
  if (logToConsole) {
    console.error(`[${context}] ${appError.message}`, appError);
  }
  
  // Afficher un toast
  if (showToast) {
    const toastMessage = getErrorMessage(appError);
    toast.error(toastMessage);
  }
  
  // Enregistrer pour l'analytique
  if (trackAnalytics) {
    trackError(`${context}_error`, {
      errorType: appError.type,
      errorCode: appError.code,
      errorMessage: appError.message,
    });
  }
  
  return appError;
}

/**
 * Normalise une erreur en format AppError
 * @param error Erreur à normaliser
 * @returns Erreur normalisée
 */
export function normalizeError(error: any): AppError {
  // Si c'est déjà une AppError, la retourner
  if (error && error.type && Object.values(ErrorType).includes(error.type)) {
    return error as AppError;
  }
  
  // Si c'est une erreur de réseau
  if (error instanceof TypeError && error.message.includes('network')) {
    return createError(
      ErrorType.NETWORK,
      'Erreur de connexion réseau. Veuillez vérifier votre connexion internet.',
      { originalError: error }
    );
  }
  
  // Si c'est une erreur HTTP
  if (error && error.status) {
    switch (error.status) {
      case 401:
        return createError(
          ErrorType.AUTHENTICATION,
          'Vous devez être connecté pour effectuer cette action.',
          { code: 'UNAUTHORIZED', originalError: error }
        );
      case 403:
        return createError(
          ErrorType.AUTHORIZATION,
          'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
          { code: 'FORBIDDEN', originalError: error }
        );
      case 404:
        return createError(
          ErrorType.NOT_FOUND,
          'La ressource demandée n\'a pas été trouvée.',
          { code: 'NOT_FOUND', originalError: error }
        );
      case 422:
        return createError(
          ErrorType.VALIDATION,
          'Les données fournies sont invalides.',
          { code: 'VALIDATION_ERROR', originalError: error }
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return createError(
          ErrorType.SERVER,
          'Une erreur serveur est survenue. Veuillez réessayer plus tard.',
          { code: 'SERVER_ERROR', originalError: error }
        );
    }
  }
  
  // Si c'est une erreur standard
  if (error instanceof Error) {
    return createError(
      ErrorType.CLIENT,
      error.message,
      { originalError: error }
    );
  }
  
  // Erreur inconnue
  return createError(
    ErrorType.UNKNOWN,
    typeof error === 'string' ? error : 'Une erreur inconnue est survenue.',
    { originalError: error }
  );
}

/**
 * Obtient un message d'erreur utilisateur à partir d'une AppError
 * @param error Erreur à traiter
 * @returns Message d'erreur utilisateur
 */
export function getErrorMessage(error: AppError): string {
  // Messages personnalisés selon le type d'erreur
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
    case ErrorType.AUTHENTICATION:
      return 'Vous devez être connecté pour effectuer cette action.';
    case ErrorType.AUTHORIZATION:
      return 'Vous n\'avez pas les permissions nécessaires.';
    case ErrorType.VALIDATION:
      return 'Les données saisies sont invalides. Veuillez vérifier vos informations.';
    case ErrorType.NOT_FOUND:
      return 'La ressource demandée n\'a pas été trouvée.';
    case ErrorType.SERVER:
      return 'Une erreur serveur est survenue. Veuillez réessayer plus tard.';
    default:
      return error.message || 'Une erreur est survenue.';
  }
}

/**
 * Crée un gestionnaire d'erreur pour les promesses
 * @param context Contexte de l'erreur
 * @returns Fonction de gestion d'erreur
 */
export function createErrorHandler(context: string) {
  return (error: any) => handleError(error, { context });
}

/**
 * Wrapper pour les fonctions asynchrones avec gestion d'erreur
 * @param fn Fonction à wrapper
 * @param context Contexte de l'erreur
 * @returns Fonction wrappée
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, { context });
      throw error;
    }
  };
}