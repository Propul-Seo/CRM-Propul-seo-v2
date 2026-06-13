-- ============================================================================
-- Migration 195 — Hotfix Sprint A.3 : ré-révoquer anon sur les vues recréées
-- ============================================================================
-- Bug détecté par le script .planning/A3_TESTS.sql après application de la
-- migration 190 (Sprint A.3.3) : DROP + CREATE VIEW dans `public` ré-attribue
-- les ACL par défaut Supabase (anon hérite de ALL via `ALTER DEFAULT
-- PRIVILEGES`). La migration 180 (A.3.2) qui révoquait anon avait donc été
-- réannulée par la 190.
--
-- Fix : retirer à nouveau les privilèges anon sur les 5 vues recréées en 190.
-- Idempotent : peut être rejoué.
--
-- Leçon : tout `CREATE VIEW` ou `CREATE TABLE` dans `public` doit être
-- immédiatement suivi d'un REVOKE explicite anon si l'objet ne doit pas être
-- exposé. La migration 190 sera complétée dans son fichier de référence (sans
-- changement DB, vu qu'on est sur prod).
-- ============================================================================

REVOKE ALL ON public.propulspace_documents_v2            FROM anon;
REVOKE ALL ON public.propulspace_invoices_v2             FROM anon;
REVOKE ALL ON public.propulspace_invoice_installments_v2 FROM anon;
REVOKE ALL ON public.propulspace_project_steps_v2        FROM anon;
REVOKE ALL ON public.propulspace_signatures_v2           FROM anon;

-- Garantir l'état authenticated (déjà GRANT SELECT en 190, on confirme)
GRANT SELECT ON public.propulspace_documents_v2            TO authenticated;
GRANT SELECT ON public.propulspace_invoices_v2             TO authenticated;
GRANT SELECT ON public.propulspace_invoice_installments_v2 TO authenticated;
GRANT SELECT ON public.propulspace_project_steps_v2        TO authenticated;
GRANT SELECT ON public.propulspace_signatures_v2           TO authenticated;
