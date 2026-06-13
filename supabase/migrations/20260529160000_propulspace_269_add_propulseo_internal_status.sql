-- ============================================================================
-- Migration 269 — Ajoute le statut 'propulseo_internal' a la contrainte CHECK
-- ============================================================================
-- Contexte : la colonne "Projets Propulseo" du kanban Projets V3 represente les
-- projets internes de l'agence. Cote front, glisser un projet dans cette colonne
-- (ou le creer/editer avec ce statut) lui assigne status='propulseo_internal'.
--
-- Probleme : projects_v2.status possede une contrainte CHECK qui n'autorisait
-- pas cette valeur -> « new row for relation "projects_v2" violates check
-- constraint "projects_v2_status_check" ».
--
-- Correctif : on recree la contrainte ORIGINALE A L'IDENTIQUE (les 20 valeurs
-- existantes : statuts generiques + statuts specifiques Site Web / ERP / Comm)
-- en ajoutant UNIQUEMENT 'propulseo_internal'. Aucune valeur existante retiree.
-- ============================================================================

ALTER TABLE public.projects_v2 DROP CONSTRAINT projects_v2_status_check;

ALTER TABLE public.projects_v2 ADD CONSTRAINT projects_v2_status_check
  CHECK ((status = ANY (ARRAY[
    'prospect'::text, 'brief_received'::text, 'quote_sent'::text, 'in_progress'::text,
    'review'::text, 'delivered'::text, 'maintenance'::text, 'on_hold'::text, 'closed'::text,
    'devis_envoye'::text, 'signe'::text, 'en_production'::text, 'livre'::text, 'perdu'::text,
    'analyse_besoins'::text, 'en_developpement'::text, 'recette'::text, 'brief_creatif'::text,
    'actif'::text, 'termine'::text,
    'propulseo_internal'::text
  ])));
