-- Fix CHECK constraint sur project_briefs_v2.status
-- Ajout de 'submitted' aux valeurs autorisées

ALTER TABLE project_briefs_v2 DROP CONSTRAINT project_briefs_v2_status_check;
ALTER TABLE project_briefs_v2 ADD CONSTRAINT project_briefs_v2_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'validated'::text, 'frozen'::text]));
