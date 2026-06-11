// Détection du sous-domaine portail (Propul'Space) vs CRM interne.
//   • espace.propulseo-site.com   → le portail est servi à la RACINE   (base '')
//   • crm.propulseo-site.com / localhost → portail sous /espace-client
//
// Source unique pour : le montage des routes (App.tsx), le basePath du
// PortalProvider, la nav des pages publiques (login/setup/reset) et les
// redirections d'auth (magic link / reset).

/** Vrai si l'app tourne sur le sous-domaine dédié au portail client. */
export function isPortalHost(hostname: string = window.location.hostname): boolean {
  return hostname.startsWith('espace.');
}

/** Préfixe de route du portail : '' sur espace.*, '/espace-client' sinon. */
export function portalBase(): string {
  return isPortalHost() ? '' : '/espace-client';
}

/** Racine de navigation du portail — jamais vide (pour navigate/Navigate). */
export function portalRoot(): string {
  return portalBase() || '/';
}

/**
 * URL publique canonique du portail, pour les liens générés CÔTÉ ADMIN
 * (signatures, emails) : l'admin tourne sur crm. mais le lien doit pointer
 * vers le sous-domaine client. Câblée via VITE_PUBLIC_PORTAL_URL, défaut espace.
 */
export const PUBLIC_PORTAL_URL: string = (
  (import.meta.env.VITE_PUBLIC_PORTAL_URL as string | undefined) || 'https://espace.propulseo-site.com'
).replace(/\/+$/, '');
