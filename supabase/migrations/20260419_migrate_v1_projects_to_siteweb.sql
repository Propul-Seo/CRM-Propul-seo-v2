-- Migration : Copie des projets v1 (Projets actifs) vers projects_v2 en tant que site_web
-- =====================================================================================
-- La table public.projects (v1) a été supprimée lors de la migration v2.
-- Cette migration recrée les projets dans projects_v2 avec category = 'site_web'
-- pour qu'ils apparaissent dans le module SiteWebManager.

-- 1. Élargir le CHECK constraint sur status pour accepter les statuts modules
ALTER TABLE public.projects_v2 DROP CONSTRAINT IF EXISTS projects_v2_status_check;

ALTER TABLE public.projects_v2 ADD CONSTRAINT projects_v2_status_check
  CHECK (status IN (
    -- Statuts génériques V2
    'prospect', 'brief_received', 'quote_sent', 'in_progress', 'review',
    'delivered', 'maintenance', 'on_hold', 'closed',
    -- Statuts SiteWeb
    'devis_envoye', 'signe', 'en_production', 'livre', 'perdu',
    -- Statuts ERP
    'analyse_besoins', 'en_developpement', 'recette',
    -- Statuts Communication
    'brief_creatif', 'actif', 'termine'
  ));

-- 2. Insérer les projets site_web (données issues du kanban v1 "Projets actifs")
INSERT INTO public.projects_v2 (
  name, client_name, status, category, presta_type,
  priority, progress, is_archived
) VALUES
  -- Ex "Planification" → signe
  ('La Maison De Tara', 'Anne Sophie', 'signe', 'site_web', '{site_web}', 'medium', 0, false),
  -- Ex "En cours" → en_production
  ('La Cia', 'Maison', 'en_production', 'site_web', '{site_web}', 'medium', 0, false),
  ('Docagone', 'Health Finder', 'en_production', 'site_web', '{site_web}', 'medium', 0, false),
  ('Lutins Farceurs', 'Béatrice', 'en_production', 'site_web', '{site_web}', 'medium', 0, false),
  ('CET6', 'Brans', 'en_production', 'site_web', '{site_web}', 'medium', 0, false),
  ('Locagame', 'Poker agency', 'en_production', 'site_web', '{site_web}', 'medium', 0, false),
  -- Ex "En pause" → prospect (pas encore signés)
  ('ERP PROPUL''SEO', 'ERP team', 'prospect', 'site_web', '{site_web}', 'medium', 0, false),
  ('Global Peinture', 'Global Peinture', 'prospect', 'site_web', '{site_web}', 'medium', 0, false),
  ('Castel', 'Maisonbelle', 'prospect', 'site_web', '{site_web}', 'medium', 0, false),
  ('Plomko', 'Aplack', 'prospect', 'site_web', '{site_web}', 'medium', 0, false),
  ('CTRP', 'CTRP', 'prospect', 'site_web', '{site_web}', 'medium', 0, false);

-- 3. Ajouter la tâche checklist pour La Maison De Tara
-- (project_id sera résolu dynamiquement)
INSERT INTO public.checklist_items_v2 (
  project_id, title, status, priority, phase, sort_order
)
SELECT id, 'https://wecandoo.fr/ateliers', 'todo', 'medium', 'general', 0
FROM public.projects_v2
WHERE name = 'La Maison De Tara' AND category = 'site_web'
LIMIT 1;
