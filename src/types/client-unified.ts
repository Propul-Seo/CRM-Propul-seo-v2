/**
 * Identité client unifiée (tranche SP1 — fusion CRM ↔ Propul'Space).
 *
 * Reflet TypeScript de la vue SQL `public.client_unified_v2` (migration 286).
 * Type custom : Supabase ne génère pas les vues dans `database.ts`.
 *
 * La vue joint `contacts` (source de vérité de l'identité, ADR-005) à
 * `project_contacts` filtré sur `role = 'primary'`. Nullabilité alignée sur
 * les colonnes sources de `contacts` / `project_contacts` (cf. database.ts).
 *
 * Read-only : la vue n'expose aucune écriture. Le CRM écrit `contacts` /
 * `project_contacts` directement ; le portail n'écrit jamais `contacts`.
 */
export interface ClientUnifiedRow {
  /** contacts.id (PK) */
  id: string;
  /** contacts.email — NOT NULL */
  email: string;
  /** contacts.name — NOT NULL */
  name: string;
  /** contacts.phone */
  phone: string | null;
  /** contacts.company */
  company: string | null;
  /** contacts.sector */
  sector: string | null;
  /** contacts.status (enum client_status) exposé en text par la vue */
  status: string;
  /** contacts.source */
  source: string | null;
  /** contacts.lead_score */
  lead_score: number | null;
  /** contacts.website */
  website: string | null;
  /** contacts.created_at */
  created_at: string | null;
  /** contacts.updated_at */
  updated_at: string | null;
  /** project_contacts.project_id — NOT NULL (jointure INNER) */
  project_id: string;
  /** project_contacts.role (enum project_contact_role) exposé en text — ici toujours 'primary' */
  contact_role: string;
}
