-- ============================================================================
-- Migration 180 — Sprint A.3.2 : retirer les GRANTs anon excessifs (R-013)
-- ============================================================================
-- Risque adressé : R-013 (🟠 Élevée) — défense en profondeur cassée.
--   Avant : anon avait INSERT/SELECT/UPDATE (et même DELETE/TRUNCATE sur les
--   vues + projects_v2) sur quasi toutes les tables/vues portail. Les RLS
--   bloquaient en pratique, mais si une RLS sautait (oubli, bug, migration
--   ratée), tout le portail serait ouvert à anon. Filet unique = mauvais.
--
-- Approche : REVOKE explicite des privilèges anon. `authenticated` conserve
-- tous ses droits (la sécurité côté authenticated repose sur RLS +
-- portal_project_id() + is_admin()).
--
-- Pré-requis :
--   - Sprint A.3.1 livré : la qualification anon passe maintenant par les
--     RPC public.qualif_*_draft (GRANT EXECUTE TO anon), plus aucun INSERT/
--     SELECT/UPDATE direct nécessaire.
--   - QualificationFlowPage.tsx refactorée pour appeler submit() (RPC) au
--     lieu d'un UPDATE direct sur la vue qualification_leads_v2.
--   - qualification_uploads n'a déjà aucun grant anon (vérifié) — paths
--     uploads stockés dans 3 colonnes texte de qualification_leads.
--   - Storage `propulspace-uploads` (anon INSERT pour la qualif anonyme)
--     reste inchangé — bucket Storage, pas table SQL.
--
-- Rollback : voir tout en bas, section commentée.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Tables du schéma propulspace
-- ───────────────────────────────────────────────────────────────────────────

REVOKE ALL ON propulspace.documents            FROM anon;
REVOKE ALL ON propulspace.invoices             FROM anon;
REVOKE ALL ON propulspace.invoice_installments FROM anon;
REVOKE ALL ON propulspace.project_steps        FROM anon;
REVOKE ALL ON propulspace.qualification_leads  FROM anon;
REVOKE ALL ON propulspace.signatures           FROM anon;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Vues du schéma public (proxies PostgREST des tables propulspace)
-- ───────────────────────────────────────────────────────────────────────────

REVOKE ALL ON public.propulspace_documents_v2            FROM anon;
REVOKE ALL ON public.propulspace_invoices_v2             FROM anon;
REVOKE ALL ON public.propulspace_invoice_installments_v2 FROM anon;
REVOKE ALL ON public.propulspace_project_steps_v2        FROM anon;
REVOKE ALL ON public.propulspace_signatures_v2           FROM anon;
REVOKE ALL ON public.qualification_leads_v2              FROM anon;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Table public.projects_v2 (anon avait DELETE/TRUNCATE — très large)
-- ───────────────────────────────────────────────────────────────────────────

REVOKE ALL ON public.projects_v2 FROM anon;

-- ───────────────────────────────────────────────────────────────────────────
-- Note : authenticated conserve tous ses droits (filtré par RLS).
-- Les RPC public.qualif_*_draft restent GRANT EXECUTE TO anon (Sprint A.3.1).
-- Le bucket Storage propulspace-uploads reste accessible à anon en INSERT
-- pour la qualif anonyme (policy storage.objects, hors scope de cette migration).
-- ───────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- ROLLBACK (commenté — à exécuter manuellement si nécessaire)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE ON propulspace.documents            TO anon;
-- GRANT SELECT, INSERT, UPDATE ON propulspace.invoices             TO anon;
-- GRANT SELECT, INSERT, UPDATE ON propulspace.invoice_installments TO anon;
-- GRANT SELECT, INSERT, UPDATE ON propulspace.project_steps        TO anon;
-- GRANT SELECT, INSERT, UPDATE ON propulspace.qualification_leads  TO anon;
-- GRANT SELECT, INSERT, UPDATE ON propulspace.signatures           TO anon;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_documents_v2            TO anon;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_invoices_v2             TO anon;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_invoice_installments_v2 TO anon;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_project_steps_v2        TO anon;
-- GRANT SELECT, INSERT, UPDATE ON public.propulspace_signatures_v2           TO anon;
-- GRANT SELECT, INSERT, UPDATE ON public.qualification_leads_v2              TO anon;
-- GRANT SELECT, INSERT, UPDATE ON public.projects_v2 TO anon;
