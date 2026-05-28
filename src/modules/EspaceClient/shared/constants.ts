/**
 * Propul'Space portal — shared constants.
 *
 * TODO Lyes: replace WHATSAPP_NUMBER + CONTACT_EMAIL with the real values
 * before first client portal activation.
 */

/** International format without +, used to build wa.me/<number> links. */
export const WHATSAPP_NUMBER = '33000000000';

/** Default contact email shown in the floating FAB. */
export const CONTACT_EMAIL = 'contact@propulseo-site.com';

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
