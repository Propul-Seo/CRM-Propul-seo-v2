-- =============================================================================
-- 303 — Nettoyage de l'enum client_status
-- Date : 2026-07-02 (appliquée en prod via MCP le même jour)
-- -----------------------------------------------------------------------------
-- Retire 4 valeurs mortes (0 usage) : proposition_envoyee, prospects, signes,
-- en_negociation. CONSERVE 'perdu' (stage funnel légitime). Enum final = 7 val.
--
-- ⚠️ La vue public.client_unified_v2 lit contacts.status → elle bloque
-- ALTER COLUMN status TYPE. On la DROP puis on la RECREE à l'identique dans la
-- même transaction (elle cast déjà en text, donc insensible au nouvel enum).
-- Backup des status dans backup_303 avant le DDL (filet de restauration).
--
-- Réversibilité : restaurer depuis backup_303.contacts_status / clients_status.
-- Purge du filet (après période d'observation) : DROP SCHEMA backup_303 CASCADE;
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS backup_303;
CREATE TABLE backup_303.contacts_status AS SELECT id, status::text AS status FROM public.contacts;
CREATE TABLE backup_303.clients_status  AS SELECT id, status::text AS status FROM public.clients;

DROP VIEW public.client_unified_v2;

ALTER TYPE public.client_status RENAME TO client_status_old;

CREATE TYPE public.client_status AS ENUM (
  'prospect',
  'meeting_booke',
  'presentation_envoyee',
  'offre_envoyee',
  'en_attente',
  'signe',
  'perdu'
);

ALTER TABLE public.contacts
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.client_status USING status::text::public.client_status;

ALTER TABLE public.clients
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.client_status USING status::text::public.client_status;

DROP TYPE public.client_status_old;

ALTER TABLE public.contacts ALTER COLUMN status SET DEFAULT 'prospect'::public.client_status;
ALTER TABLE public.clients  ALTER COLUMN status SET DEFAULT 'prospect'::public.client_status;

-- Recréation à l'identique (def récupérée via pg_get_viewdef avant le DROP)
CREATE VIEW public.client_unified_v2 AS
 SELECT c.id, c.email, c.name, c.phone, c.company, c.sector,
    c.status::text AS status,
    c.source, c.lead_score, c.website, c.created_at, c.updated_at,
    pc.project_id,
    pc.role::text AS contact_role
   FROM contacts c
     JOIN project_contacts pc ON pc.contact_id = c.id AND pc.role = 'primary'::project_contact_role;
