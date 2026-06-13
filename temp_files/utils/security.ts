/**
 * Utilitaires de sécurité pour l'application
 */

/**
 * Échappe les caractères HTML dangereux pour prévenir les attaques XSS
 * @param str Chaîne à échapper
 * @returns Chaîne échappée
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
}

/**
 * Génère un token CSRF pour les formulaires
 * @returns Token CSRF
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie si une URL est sécurisée (HTTPS ou relative)
 * @param url URL à vérifier
 * @returns true si l'URL est sécurisée
 */
export function isSecureUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true; // URL relative
  
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Valide une URL pour éviter les injections
 * @param url URL à valider
 * @returns URL validée ou null si invalide
 */
export function validateUrl(url: string): string | null {
  if (!url) return null;
  
  // Liste d'URL autorisées
  const allowedDomains = [
    'propulseo.com',
    'supabase.co',
    'pexels.com',
    'unsplash.com',
    'googleapis.com',
    'gstatic.com',
    'cloudflare.com'
  ];
  
  try {
    const parsedUrl = new URL(url);
    
    // Vérifier si le domaine est autorisé
    const isDomainAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    if (!isDomainAllowed && !parsedUrl.hostname.startsWith('localhost')) {
      console.warn(`URL domain not allowed: ${parsedUrl.hostname}`);
      return null;
    }
    
    // Vérifier le protocole
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      console.warn(`URL protocol not allowed: ${parsedUrl.protocol}`);
      return null;
    }
    
    return url;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

/**
 * Sanitize les données d'entrée utilisateur
 * @param input Données à nettoyer
 * @returns Données nettoyées
 */
export function sanitizeInput<T>(input: T): T {
  if (typeof input === 'string') {
    // Nettoyer les chaînes de caractères
    return escapeHtml(input) as unknown as T;
  } else if (Array.isArray(input)) {
    // Nettoyer les tableaux récursivement
    return input.map(item => sanitizeInput(item)) as unknown as T;
  } else if (input !== null && typeof input === 'object') {
    // Nettoyer les objets récursivement
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = sanitizeInput(value);
    }
    return result as T;
  }
  
  // Retourner les autres types tels quels
  return input;
}

/**
 * Vérifie la force d'un mot de passe
 * @param password Mot de passe à vérifier
 * @returns Score de force (0-100) et feedback
 */
export function checkPasswordStrength(password: string): { 
  score: number; 
  feedback: string;
  isStrong: boolean;
} {
  if (!password) {
    return { score: 0, feedback: 'Mot de passe requis', isStrong: false };
  }
  
  let score = 0;
  const feedback: string[] = [];
  
  // Longueur
  if (password.length < 8) {
    feedback.push('Trop court (min. 8 caractères)');
  } else {
    score += 20;
  }
  
  // Complexité
  if (/[A-Z]/.test(password)) score += 20;
  else feedback.push('Ajouter une majuscule');
  
  if (/[a-z]/.test(password)) score += 20;
  else feedback.push('Ajouter une minuscule');
  
  if (/[0-9]/.test(password)) score += 20;
  else feedback.push('Ajouter un chiffre');
  
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else feedback.push('Ajouter un caractère spécial');
  
  return { 
    score, 
    feedback: feedback.join(', ') || 'Mot de passe fort',
    isStrong: score >= 60
  };
}

/**
 * Masque partiellement une adresse email pour l'affichage
 * @param email Email à masquer
 * @returns Email partiellement masqué
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + 
    '*'.repeat(Math.max(1, username.length - 2)) + 
    (username.length > 1 ? username.charAt(username.length - 1) : '');
  
  return `${maskedUsername}@${domain}`;
}