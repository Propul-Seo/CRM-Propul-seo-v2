-- Sprint 5 : Archivage des tables originales
-- ============================================
-- Renomme les anciennes tables en _archive_* pour conservation 30 jours.
-- Après validation en production, exécuter la migration finale de suppression.

-- Note : ne renommer que si la table existe encore (les vues compat sont déjà supprimées)

DO $$
DECLARE
  tbl text;
  tables_to_archive text[] := ARRAY[
    'projects_v2',
    'project_activities_v2',
    'project_documents_v2',
    'follow_ups_v2',
    'checklist_items_v2',
    'project_briefs_v2',
    'invoices_v2',
    'project_accesses_v2',
    'comm_tasks_v2'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_archive LOOP
    -- Vérifier que c'est une table (pas une vue)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO _archive_%I', tbl, tbl);
      RAISE NOTICE 'Archivé : public.% → public._archive_%', tbl, tbl;
    ELSE
      RAISE NOTICE 'Ignoré (inexistant ou vue) : public.%', tbl;
    END IF;
  END LOOP;
END $$;

-- Ajouter un commentaire avec la date d'archivage pour le suivi
COMMENT ON SCHEMA v2 IS 'Schéma V2 actif — tables originales archivées le ' || now()::date;
