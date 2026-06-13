-- ============================================================================
-- Migration 286 — Vue canonique client_unified_v2 + durcissement RLS project_contacts
-- ============================================================================
-- Tranche SP1 (fusion CRM ↔ Propul'Space). Référence :
--   docs/superpowers/specs/2026-06-08-sp1-identite-client-design.md (§5)
--
-- Objectif :
--   1. Exposer une vue canonique de l'identité client (contacts + project_contacts
--      role='primary'), alimentée par `contacts` (source de vérité, ADR-005),
--      jamais par auth.users.
--   2. FERMER LA FUITE RLS sur public.project_contacts : aujourd'hui lisible ET
--      écrivable par TOUT authentifié (USING(true)), y compris un client portail.
--
-- ⚠️ ATOMIQUE — vue + durcissement RLS DANS LA MÊME TRANSACTION. Sinon, fenêtre
-- où la vue existe sans le filtre portail = fuite. On garde une policy FOR ALL
-- (équipe) EN PLUS de la FOR SELECT portail, sinon les écritures CRM
-- (useProjectContactsV3, session admin) cassent (RLS bloquant par défaut).
--
-- Load-bearing (NON modifiés) : propulspace.portal_project_id() (mig. 070/140),
-- public.is_team_member() (mig. 259). Cette migration ne touche QUE la RLS de
-- public.project_contacts et ajoute la vue public.client_unified_v2.
-- ============================================================================

BEGIN;

-- 1. Vue canonique identité client (read-only, pattern mig. 254)
DROP VIEW IF EXISTS public.client_unified_v2;
CREATE VIEW public.client_unified_v2
  WITH (security_invoker = true) AS
SELECT
  c.id, c.email, c.name, c.phone, c.company, c.sector,
  c.status::text AS status, c.source, c.lead_score, c.website,
  c.created_at, c.updated_at,
  pc.project_id,
  pc.role::text AS contact_role
FROM public.contacts c
INNER JOIN public.project_contacts pc
  ON pc.contact_id = c.id AND pc.role = 'primary';

REVOKE ALL ON public.client_unified_v2 FROM anon;   -- règle maison (mig. 195)
GRANT SELECT ON public.client_unified_v2 TO authenticated;

-- 2. Durcissement RLS project_contacts : remplacer les policies permissives
DROP POLICY IF EXISTS "project_contacts_read"  ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_write" ON public.project_contacts;

-- 2a. Lecture : équipe interne OU client portail de CE projet uniquement
CREATE POLICY "project_contacts_select"
  ON public.project_contacts FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR project_id = propulspace.portal_project_id()
  );

-- 2b. Écriture : équipe interne seule (FOR ALL, sinon INSERT/UPDATE/DELETE CRM bloqués)
CREATE POLICY "project_contacts_write_team"
  ON public.project_contacts FOR ALL TO authenticated
  USING (public.is_team_member())
  WITH CHECK (public.is_team_member());

COMMENT ON VIEW public.client_unified_v2 IS
  'Vue canonique identité client (contacts + project_contacts role=primary). SP1 fusion.';

COMMIT;
