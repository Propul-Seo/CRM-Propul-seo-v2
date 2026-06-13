-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- 🔴 RISQUE R-011 — CRITIQUE / RGPD (documenté dans .planning/PROGRESS_PROPULSPACE.md) :
-- Les policies ci-dessous autorisent anon à SELECT et UPDATE n'importe quel
-- draft de qualification_leads sans filtre par session/identité.
--   - SELECT  → fuite RGPD : tous les drafts (nom, email, tel, entreprise, budget)
--               accessibles via API anon sans filtre.
--   - UPDATE  → un anon qui connaît l'UUID d'un draft peut le modifier
--               ou le forcer en 'submitted'.
-- Mitigation actuelle : UUID imprévisibles (security by obscurity).
-- PRIORITÉ Sprint A.3 : durcir avec session_token signé ou RPC SECURITY DEFINER.

CREATE POLICY ps_qualif_public_insert ON propulspace.qualification_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'draft' AND submitted_at IS NULL);

CREATE POLICY ps_qualif_public_update_draft ON propulspace.qualification_leads
  FOR UPDATE TO anon, authenticated
  USING (status = 'draft')
  WITH CHECK (status IN ('draft', 'submitted'));

CREATE POLICY ps_qualif_public_select_draft ON propulspace.qualification_leads
  FOR SELECT TO anon, authenticated
  USING (status = 'draft');
