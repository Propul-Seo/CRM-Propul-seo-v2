/**
 * Propul'Space portal — shared constants.
 */

/** Adresse de contact réelle de l'équipe Propul'SEO (FAB + Aide + mailto). */
export const CONTACT_EMAIL = 'team@propulseo-site.com';

/** WhatsApp par membre Propul'SEO assigné au projet. Format international wa.me
 *  (sans +, le 0 initial du mobile FR devient 33). La clé est un fragment de nom
 *  en minuscules sans accent, cherché dans projects_v2.assigned_name. */
export const TEAM_WHATSAPP: Record<string, string> = {
  lyes: '33651986418',
  etienne: '33695321389',
};

/** Minuscule + suppression des accents, pour matcher « Étienne » ↔ « etienne ». */
function normalizeName(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Résout le WhatsApp du membre assigné depuis son nom (projects_v2.assigned_name).
 *  Retourne null si non reconnu → le bouton WhatsApp est masqué (l'email reste). */
export function resolveTeamWhatsapp(assignedName: string | null | undefined): string | null {
  if (!assignedName) return null;
  const haystack = normalizeName(assignedName);
  for (const [key, number] of Object.entries(TEAM_WHATSAPP)) {
    if (haystack.includes(key)) return number;
  }
  return null;
}

/** Display name shown in the WhatsApp pre-filled message. */
export const AGENCY_NAME = "Propul'SEO";

/** Tab keys for the portal navigation. Kept in sync with the route segments
 *  defined in App.tsx (Task A5). */
export const PORTAL_TABS = [
  'dashboard',
  'project',
  'documents',
  'invoices',
  'signatures',
  'help',
] as const;

export type PortalTab = (typeof PORTAL_TABS)[number];
