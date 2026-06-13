import { format, parseISO, formatISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Utilitaires pour la gestion des dates en fuseau horaire français
 */

// Fuseau horaire français
export const FRENCH_TIMEZONE = 'Europe/Paris';

/**
 * Convertit une date UTC en date française
 */
export function utcToFrenchDate(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  
  // Forcer la conversion en heure française
  const frenchDate = new Date(date.toLocaleString('en-US', { timeZone: FRENCH_TIMEZONE }));
  
  // Ajuster pour l'heure d'été/hiver - variables supprimées car inutilisées
  // const offset = frenchDate.getTimezoneOffset();
  // const frenchOffset = new Date().toLocaleString('en-US', { timeZone: FRENCH_TIMEZONE }).split(',')[1];
  
  return frenchDate;
}

/**
 * Convertit une date française en UTC
 */
export function frenchDateToUtc(frenchDate: Date): string {
  return formatISO(frenchDate);
}

/**
 * Formate une date pour l'affichage en français
 */
export function formatFrenchDate(date: string | Date, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // Forcer l'affichage en heure française
  const frenchTime = dateObj.toLocaleString('fr-FR', { 
    timeZone: FRENCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Si on veut un format spécifique, on utilise date-fns
  if (formatStr !== 'dd/MM/yyyy HH:mm') {
    const frenchDate = utcToFrenchDate(date);
    return format(frenchDate, formatStr, { locale: fr });
  }
  
  return frenchTime;
}

/**
 * Formate une date courte (jour/mois/année)
 */
export function formatFrenchDateShort(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // Forcer l'affichage en heure française
  return dateObj.toLocaleDateString('fr-FR', { 
    timeZone: FRENCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formate une date avec heure
 */
export function formatFrenchDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // Forcer l'affichage en heure française
  const frenchTime = dateObj.toLocaleString('fr-FR', { 
    timeZone: FRENCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return frenchTime.replace(',', ' à');
}

/**
 * Formate une date relative (il y a X temps)
 */
export function formatFrenchDateRelative(date: string | Date): string {
  const frenchDate = utcToFrenchDate(date);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - frenchDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  
  return formatFrenchDateShort(date);
}

/**
 * Obtient la date actuelle en fuseau horaire français
 */
export function getCurrentFrenchDate(): Date {
  const now = new Date();
  const frenchTime = now.toLocaleString('en-US', { timeZone: FRENCH_TIMEZONE });
  return new Date(frenchTime);
}

/**
 * Obtient l'heure actuelle française au format HH:mm
 */
export function getCurrentFrenchTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('fr-FR', { 
    timeZone: FRENCH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtient la date et heure actuelles françaises
 */
export function getCurrentFrenchDateTime(): string {
  const now = new Date();
  return now.toLocaleString('fr-FR', { 
    timeZone: FRENCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtient la date actuelle en UTC
 */
export function getCurrentUtcDate(): string {
  return formatISO(new Date());
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: string | Date): boolean {
  const frenchDate = utcToFrenchDate(date);
  const today = getCurrentFrenchDate();
  
  return frenchDate.toDateString() === today.toDateString();
}

/**
 * Vérifie si une date est hier
 */
export function isYesterday(date: string | Date): boolean {
  const frenchDate = utcToFrenchDate(date);
  const yesterday = new Date(getCurrentFrenchDate());
  yesterday.setDate(yesterday.getDate() - 1);
  
  return frenchDate.toDateString() === yesterday.toDateString();
}

/**
 * Formate une date pour l'affichage intelligent
 */
export function formatSmartDate(date: string | Date): string {
  if (isToday(date)) return 'Aujourd\'hui';
  if (isYesterday(date)) return 'Hier';
  return formatFrenchDateShort(date);
}

/**
 * Formate une date pour l'affichage dans les listes
 */
export function formatListDate(date: string | Date): string {
  const frenchDate = utcToFrenchDate(date);
  const now = getCurrentFrenchDate();
  const diffInDays = Math.floor((now.getTime() - frenchDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return format(frenchDate, 'HH:mm', { locale: fr });
  } else if (diffInDays === 1) {
    return 'Hier';
  } else if (diffInDays < 7) {
    return format(frenchDate, 'EEEE', { locale: fr });
  } else {
    return formatFrenchDateShort(date);
  }
} 