/**
 * Logger wrapper pour développement et production
 *
 * En production, tous les logs sont désactivés sauf les erreurs critiques
 * En développement, tous les logs sont affichés
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Niveau de log
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Niveau minimum selon l'environnement
const minLogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;

class Logger {
  private formatMessage(level: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}]`;
  }

  /**
   * Log de débogage - Uniquement en développement
   */
  debug(...args: unknown[]): void {
    if (minLogLevel <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG'), ...args);
    }
  }

  /**
   * Log d'information - Uniquement en développement
   */
  info(...args: unknown[]): void {
    if (minLogLevel <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO'), ...args);
    }
  }

  /**
   * Log d'avertissement - Uniquement en développement
   */
  warn(...args: unknown[]): void {
    if (minLogLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN'), ...args);
    }
  }

  /**
   * Log d'erreur - Toujours affiché
   */
  error(...args: unknown[]): void {
    if (minLogLevel <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR'), ...args);
    }
  }

  /**
   * Log spécial pour le développement
   */
  dev(...args: unknown[]): void {
    if (isDevelopment) {
      console.log('🔧 [DEV]', ...args);
    }
  }

  /**
   * Log pour les réels-time updates
   */
  realtime(...args: unknown[]): void {
    if (isDevelopment) {
      console.log('🔄 [REALTIME]', ...args);
    }
  }

  /**
   * Log pour les appels API
   */
  api(...args: unknown[]): void {
    if (isDevelopment) {
      console.log('📡 [API]', ...args);
    }
  }

  /**
   * Log pour les actions utilisateur
   */
  user(...args: unknown[]): void {
    if (isDevelopment) {
      console.log('👤 [USER]', ...args);
    }
  }

  /**
   * Log pour les calculs et métriques
   */
  metric(...args: unknown[]): void {
    if (isDevelopment) {
      console.log('📊 [METRIC]', ...args);
    }
  }

  /**
   * Log pour les succès
   */
  success(...args: unknown[]): void {
    if (isDevelopment) {
      console.log('✅ [SUCCESS]', ...args);
    }
  }

  /**
   * Log pour les erreurs critiques - Toujours affiché
   */
  critical(...args: unknown[]): void {
    console.error('🔴 [CRITICAL]', ...args);

    // En production, envoyer à un service de monitoring
    if (isProduction) {
      // TODO: Intégrer un service comme Sentry, LogRocket, etc.
      // sendToMonitoring(args);
    }
  }

  /**
   * Log pour les performances
   */
  perf(label: string, fn: () => void): void {
    if (isDevelopment) {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`⚡ [PERF] ${label}: ${(end - start).toFixed(2)}ms`);
    } else {
      fn();
    }
  }

  /**
   * Log pour les groupes (pour une meilleure organisation dans la console)
   */
  group(label: string, fn: () => void): void {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  /**
   * Log pour les tableaux
   */
  table(data: unknown[]): void {
    if (isDevelopment && Array.isArray(data)) {
      console.table(data);
    }
  }
}

// Export une instance singleton
export const logger = new Logger();

// Export par défaut pour faciliter les imports
export default logger;

// Helper pour migration facile depuis console.log
export const log = logger.info.bind(logger);
