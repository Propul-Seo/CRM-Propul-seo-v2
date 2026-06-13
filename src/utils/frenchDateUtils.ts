/**
 * Utilitaires pour la gestion des dates en heure française
 * Toutes les fonctions utilisent le fuseau horaire Europe/Paris
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const FRENCH_TIMEZONE = 'Europe/Paris';

/**
 * Convertit une date en heure française pour les comparaisons
 */
export function toFrenchTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, FRENCH_TIMEZONE);
}

/**
 * Formate une date avec contexte relatif (Aujourd'hui, Hier, etc.) en heure française
 */
export function formatDateWithContext(date: string): string {
  const today = new Date();
  const activityDate = new Date(date);
  
  // Compare dates in French timezone - get just the date part
  const activityParis = new Date(activityDate.toLocaleDateString('en-US', { timeZone: 'Europe/Paris' }));
  const nowParis = new Date(today.toLocaleDateString('en-US', { timeZone: 'Europe/Paris' }));
  
  // Reset time to midnight for accurate day comparison
  activityParis.setHours(0, 0, 0, 0);
  nowParis.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((activityParis.getTime() - nowParis.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Aujourd'hui " + activityDate.toLocaleTimeString('fr-FR', { 
      timeZone: 'Europe/Paris',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === -1) {
    return "Hier " + activityDate.toLocaleTimeString('fr-FR', { 
      timeZone: 'Europe/Paris',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays < -1) {
    return `Il y a ${Math.abs(diffDays)} jours`;
  } else if (diffDays === 1) {
    return "Demain " + activityDate.toLocaleTimeString('fr-FR', { 
      timeZone: 'Europe/Paris',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    return activityDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) + " " + 
           activityDate.toLocaleTimeString('fr-FR', { 
             timeZone: 'Europe/Paris',
             hour: '2-digit', 
             minute: '2-digit' 
           });
  }
}

/**
 * Formate une date complète en français avec heure française
 */
export function formatFullDate(date: string): string {
  // Show date and time in French timezone
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) + ' ' + dateObj.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' });
}

/**
 * Formate une date relative simple (Aujourd'hui, Hier, etc.) en heure française
 */
export function formatRelativeDate(date: string): string {
  const dateObj = new Date(date);
  const now = new Date();
  
  // Compare dates in French timezone - get just the date part
  const dateParis = new Date(dateObj.toLocaleDateString('en-US', { timeZone: 'Europe/Paris' }));
  const nowParis = new Date(now.toLocaleDateString('en-US', { timeZone: 'Europe/Paris' }));
  
  // Reset time to midnight for accurate day comparison
  dateParis.setHours(0, 0, 0, 0);
  nowParis.setHours(0, 0, 0, 0);
  
  const diffInMs = dateParis.getTime() - nowParis.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Aujourd\'hui';
  if (diffInDays === 1) return 'Demain';
  if (diffInDays === -1) return 'Hier';
  if (diffInDays > 0) return `Dans ${diffInDays} jours`;
  return `Il y a ${Math.abs(diffInDays)} jours`;
}

/**
 * Vérifie si une activité est en retard (en heure française)
 */
export function isOverdue(dateString: string): boolean {
  const today = new Date();
  const activity = new Date(dateString);
  
  // Convertir en heure française pour les comparaisons
  const todayParis = toFrenchTime(today);
  const activityParis = toFrenchTime(activity);
  
  todayParis.setHours(0, 0, 0, 0);
  activityParis.setHours(0, 0, 0, 0);
  
  return activityParis.getTime() < todayParis.getTime();
}

/**
 * Vérifie si une activité est aujourd'hui (en heure française)
 */
export function isToday(dateString: string): boolean {
  const today = new Date();
  const activity = new Date(dateString);
  
  // Convertir en heure française pour les comparaisons
  const todayParis = toFrenchTime(today);
  const activityParis = toFrenchTime(activity);
  
  return todayParis.toDateString() === activityParis.toDateString();
}

/**
 * Vérifie si une activité est en retard (pour les activités avec statut)
 */
export function isActivityOverdue(dateString: string, status: string): boolean {
  if (status !== 'pending') return false;
  return isOverdue(dateString);
}

/**
 * Crée une date en interprétant la date/heure comme étant en heure française
 * @param dateString Date au format YYYY-MM-DD
 * @param timeString Heure au format HH:MM
 * @returns Date en UTC pour stockage en base
 */
export function createFrenchDateTime(dateString: string, timeString: string): string {
  // Force French timezone - no conversion, just treat as French time
  const dateTimeString = `${dateString}T${timeString}:00+02:00`;
  const tempDate = new Date(dateTimeString);
  return tempDate.toISOString();
}