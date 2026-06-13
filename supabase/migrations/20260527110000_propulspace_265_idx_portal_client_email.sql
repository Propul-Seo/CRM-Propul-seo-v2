-- 265 — R-009 : index sur projects_v2.portal_client_email
-- Sans cet index, propulspace.portal_project_id() fait un full scan à chaque
-- appel RLS d'un client. OK aujourd'hui (51 projets), critique à 10k+.

CREATE INDEX IF NOT EXISTS idx_projects_v2_portal_client_email
  ON public.projects_v2(portal_client_email)
  WHERE portal_client_email IS NOT NULL;

COMMENT ON INDEX public.idx_projects_v2_portal_client_email IS
  'R-009 : accélère propulspace.portal_project_id() v2 (migration 140).';
