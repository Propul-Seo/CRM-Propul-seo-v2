-- ============================================================================
-- Migration 291 — Repère de conversion sur les pipelines site web & ERP (SP2)
-- ============================================================================
-- Contexte : la qualif (qualification_leads_v2) possède déjà
-- converted_to_project_id (anti double-conversion + lien lead→projet). Les
-- pipelines site web (public.contacts) et ERP (public.crmerp_leads) en sont
-- dépourvus → risque de double conversion et perte du lien source↔projet.
--
-- SP2 ajoute la même colonne aux deux tables + un index partiel (seules les
-- lignes converties sont indexées). La RPC unifiée 292 s'en sert pour refuser
-- une 2ᵉ conversion et tracer le projet créé.
--
-- Idempotent : ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.
-- ============================================================================

-- Pipeline site web (contacts)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS converted_to_project_id uuid NULL
  REFERENCES public.projects_v2(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_converted_to_project_id
  ON public.contacts(converted_to_project_id)
  WHERE converted_to_project_id IS NOT NULL;

COMMENT ON COLUMN public.contacts.converted_to_project_id IS
  'SP2 : projet projects_v2 créé par la conversion de ce lead site web (NULL = pas encore converti). Anti double-conversion.';

-- Pipeline ERP (crmerp_leads)
ALTER TABLE public.crmerp_leads
  ADD COLUMN IF NOT EXISTS converted_to_project_id uuid NULL
  REFERENCES public.projects_v2(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crmerp_leads_converted_to_project_id
  ON public.crmerp_leads(converted_to_project_id)
  WHERE converted_to_project_id IS NOT NULL;

COMMENT ON COLUMN public.crmerp_leads.converted_to_project_id IS
  'SP2 : projet projects_v2 créé par la conversion de ce lead ERP (NULL = pas encore converti). Anti double-conversion.';
