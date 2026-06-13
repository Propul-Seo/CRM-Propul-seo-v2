-- ============================================================
-- projects_v2.comm_status : pipeline kanban du module Communication
-- Valeurs alignées sur le type StatusComm (src/types/project-v2.ts)
-- ============================================================

ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS comm_status TEXT
    CHECK (comm_status IN (
      'prospect',
      'brief_creatif',
      'devis_envoye',
      'signe',
      'en_production',
      'actif',
      'termine',
      'perdu'
    ));

CREATE INDEX IF NOT EXISTS idx_projects_v2_comm_status
  ON public.projects_v2(comm_status)
  WHERE comm_status IS NOT NULL;
