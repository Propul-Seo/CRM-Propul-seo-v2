/**
 * Utilitaires généraux pour l'application
 */

import { format as formatDateFn } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date en format français
 * @param date Date à formater
 * @param formatStr Format de date souhaité
 * @returns Date formatée
 */
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDateFn(dateObj, formatStr, { locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date invalide';
  }
}

/**
 * Tronque un texte à une longueur maximale
 * @param text Texte à tronquer
 * @param maxLength Longueur maximale
 * @returns Texte tronqué
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Génère un ID unique
 * @returns ID unique
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formate un montant en devise
 * @param amount Montant à formater
 * @param currency Devise (EUR par défaut)
 * @returns Montant formaté
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calcule le temps écoulé depuis une date
 * @param date Date de référence
 * @returns Temps écoulé en format lisible
 */
export function timeAgo(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (seconds < 60) return 'à l\'instant';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `il y a ${days}j`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `il y a ${months} mois`;
    
    const years = Math.floor(months / 12);
    return `il y a ${years} an${years > 1 ? 's' : ''}`;
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'Date invalide';
  }
}