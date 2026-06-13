// ===== LOGGER SECURISE =====
// Remplace console.log avec sanitization des donnees sensibles
// Ne log rien en production sauf erreurs critiques

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// Cles sensibles a masquer automatiquement
const SENSITIVE_KEYS = [
  'password',
  'token',
  'key',
  'secret',
  'authorization',
  'cookie',
  'session',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'bearer',
  'credential',
  'private',
];

class Logger {
  private isDev = import.meta.env.DEV;
  private isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  /**
   * Sanitize les donnees pour masquer les informations sensibles
   */
  private sanitize(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const keyLower = key.toLowerCase();

      // Masquer les cles sensibles
      if (SENSITIVE_KEYS.some(sensitive => keyLower.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
      // Masquer les emails partiellement
      else if (keyLower.includes('email') && typeof value === 'string') {
        sanitized[key] = this.maskEmail(value);
      }
      // Recursion pour objets imbriques
      else if (typeof value === 'object') {
        sanitized[key] = this.sanitize(value);
      }
      else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Masque partiellement un email
   */
  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return email;

    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2
      ? name[0] + '***' + name[name.length - 1]
      : '***';

    return `${maskedName}@${domain}`;
  }

  /**
   * Formate une entree de log
   */
  private formatEntry(entry: LogEntry): string {
    const { level, message, context, timestamp } = entry;
    const prefix = context ? `[${context}]` : '';
    const time = timestamp.split('T')[1]?.split('.')[0] || timestamp;
    return `${time} ${level.toUpperCase().padEnd(5)} ${prefix} ${message}`;
  }

  /**
   * Log interne
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      data: data ? this.sanitize(data) as Record<string, unknown> : undefined,
    };

    // En developpement : afficher dans la console
    if (this.isDev || this.isDebugMode) {
      const formatted = this.formatEntry(entry);
      const logData = entry.data ? entry.data : '';

      switch (level) {
        case 'error':
          console.error(formatted, logData);
          break;
        case 'warn':
          console.warn(formatted, logData);
          break;
        case 'debug':
          console.debug(formatted, logData);
          break;
        default:
          console.log(formatted, logData);
      }
    }

    // En production : envoyer les erreurs a un service de monitoring
    if (!this.isDev && (level === 'error' || level === 'warn')) {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Envoyer a un service de monitoring (Sentry, etc.)
   */
  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Implementer l'integration Sentry
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureMessage(entry.message, {
    //     level: entry.level === 'error' ? 'error' : 'warning',
    //     tags: { context: entry.context },
    //     extra: entry.data,
    //   });
    // }
  }

  // ===== METHODES PUBLIQUES =====

  /**
   * Log de debug - uniquement en dev
   */
  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (this.isDev || this.isDebugMode) {
      this.log('debug', message, context, data);
    }
  }

  /**
   * Log d'information
   */
  info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('info', message, context, data);
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('warn', message, context, data);
  }

  /**
   * Log d'erreur
   */
  error(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('error', message, context, data);
  }

  /**
   * Log d'erreur avec exception
   */
  exception(error: Error, context?: string, data?: Record<string, unknown>): void {
    this.log('error', error.message, context, {
      ...data,
      stack: this.isDev ? error.stack : undefined,
      name: error.name,
    });
  }

  /**
   * Groupe de logs (dev only)
   */
  group(label: string): void {
    if (this.isDev) {
      console.group(label);
    }
  }

  /**
   * Fin de groupe de logs (dev only)
   */
  groupEnd(): void {
    if (this.isDev) {
      console.groupEnd();
    }
  }

  /**
   * Timer pour mesurer les performances (dev only)
   */
  time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }

  /**
   * Fin du timer (dev only)
   */
  timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }
}

// Export singleton
export const logger = new Logger();

// ===== EXEMPLES D'UTILISATION =====
/*
import { logger } from '@/lib/logger';

// Debug (dev only)
logger.debug('Contact charge', 'ContactService', { contactId: '123' });

// Info
logger.info('Utilisateur connecte', 'Auth', { userId: '456' });

// Warning
logger.warn('Rate limit proche', 'API', { remaining: 10 });

// Error
logger.error('Echec creation contact', 'ContactService', { error: 'Validation failed' });

// Exception
try {
  throw new Error('Something went wrong');
} catch (e) {
  logger.exception(e as Error, 'MyComponent');
}

// Performance
logger.time('fetchContacts');
// ... code
logger.timeEnd('fetchContacts');
*/
