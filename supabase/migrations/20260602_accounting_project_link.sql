-- Comptabilité Phase 2 — Feature B : budget projet vs réalisé
-- Lie une écriture comptable à un projet (table projets live = public.projects_v2).
-- Exécutée à la main dans le SQL Editor Supabase le 2026-06-02. Idempotent.
-- RLS inchangée : les policies existantes couvrent la nouvelle colonne.

ALTER TABLE public.accounting_entries
  ADD COLUMN IF NOT EXISTS project_id uuid;

-- FK vers projects_v2 (rejouable). ON DELETE SET NULL : on garde l'écriture si le projet disparaît.
ALTER TABLE public.accounting_entries DROP CONSTRAINT IF EXISTS fk_accounting_entries_project;
ALTER TABLE public.accounting_entries
  ADD CONSTRAINT fk_accounting_entries_project
  FOREIGN KEY (project_id) REFERENCES public.projects_v2(id) ON DELETE SET NULL;

-- Index pour les agrégations par projet
CREATE INDEX IF NOT EXISTS idx_accounting_entries_project_id ON public.accounting_entries(project_id);
