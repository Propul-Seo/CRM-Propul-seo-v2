-- ============================================================================
-- Migration 247 — Boucler R-012 sur qualification_leads_v2 + ouvrir SELECT équipe
-- ============================================================================
-- Risques adressés :
--   1. 🔴 CRITIQUE — `public.qualification_leads_v2` n'a pas `security_invoker=true`.
--      Toutes les autres vues `propulspace_*_v2` l'ont (cf migration 195).
--      Conséquence : la vue s'exécute avec les droits du créateur (postgres
--      superuser) et BYPASS les RLS de `propulspace.qualification_leads`.
--      Un utilisateur `authenticated` quelconque (y compris un client portail)
--      peut dumper nom/email/tel/budget de TOUS les leads via :
--        SELECT * FROM public.qualification_leads_v2;
--      → fuite RGPD massive.
--
--   2. Effet de bord du fix #1 : une fois `security_invoker=true` activé, la
--      seule policy active sur la table est `ps_qualif_admin_all` (admin/manager).
--      Les rôles `sales`, `marketing`, `developer`, `ops` perdent l'accès lecture
--      au module LeadsV3 qui s'appuie sur cette vue.
--      → on ajoute une policy SELECT équipe entière, avec une nouvelle fonction
--      `propulspace.is_propulseo_team()` (toute l'équipe agence).
--
-- Écritures (INSERT/UPDATE/DELETE) restent réservées à admin/manager via
-- `ps_qualif_admin_all` (inchangée).
--
-- Rollback : voir tout en bas, section commentée.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Fonction propulspace.is_propulseo_team() — toute l'équipe agence
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION propulspace.is_propulseo_team()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'manager', 'sales', 'marketing', 'developer', 'ops')
  );
$$;

COMMENT ON FUNCTION propulspace.is_propulseo_team() IS
  'Renvoie true si l''utilisateur connecté fait partie de l''équipe Propul''SEO (n''importe quel rôle agence). Plus large que is_admin() qui restreint à admin+manager. Utilisée pour ouvrir la lecture des leads à toute l''équipe sans donner les droits d''écriture.';

REVOKE EXECUTE ON FUNCTION propulspace.is_propulseo_team() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.is_propulseo_team() TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Policy SELECT équipe sur propulspace.qualification_leads
-- ───────────────────────────────────────────────────────────────────────────
-- Idempotent : DROP IF EXISTS pour permettre rejouer la migration localement.

DROP POLICY IF EXISTS ps_qualif_team_select ON propulspace.qualification_leads;

CREATE POLICY ps_qualif_team_select ON propulspace.qualification_leads
  FOR SELECT
  TO authenticated
  USING (propulspace.is_propulseo_team());

COMMENT ON POLICY ps_qualif_team_select ON propulspace.qualification_leads IS
  'SELECT ouvert à toute l''équipe agence (admin/manager/sales/marketing/developer/ops). Écritures restent réservées à admin+manager via ps_qualif_admin_all.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Activer security_invoker sur la vue public.qualification_leads_v2
-- ───────────────────────────────────────────────────────────────────────────
-- Maintenant que la policy SELECT équipe est en place, on peut basculer la vue
-- en security_invoker sans casser LeadsV3 pour les rôles non-admin.

ALTER VIEW public.qualification_leads_v2 SET (security_invoker = true);

COMMENT ON VIEW public.qualification_leads_v2 IS
  'Vue admin des leads qualifiés (RLS héritée via security_invoker=true depuis 247). Visible par toute l''équipe via ps_qualif_team_select. Écritures admin/manager only.';

-- ============================================================================
-- ROLLBACK (commenté — à exécuter manuellement si nécessaire)
-- ============================================================================
-- ALTER VIEW public.qualification_leads_v2 RESET (security_invoker);
-- DROP POLICY IF EXISTS ps_qualif_team_select ON propulspace.qualification_leads;
-- DROP FUNCTION IF EXISTS propulspace.is_propulseo_team();
