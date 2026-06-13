-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- ⚠️ Patch ADR-001 : remplace public.handle_new_user() (trigger BEFORE/AFTER
-- INSERT ON auth.users défini par une migration CRM antérieure). Sans ce patch,
-- la création d'un auth.user pour un client portail plantait sur l'INSERT
-- dans public.users → erreur "Database error saving new user" sur magic link.
--
-- Comportement final :
--   1. Si l'email correspond à un projects_v2.portal_client_email → skip INSERT
--      (client portail, pas de row dans public.users — réservée aux internes).
--   2. Sinon (interne agence) : tente INSERT, log WARNING si échec, ne bloque
--      pas l'auth.
--
-- 🟡 Risque R-014 (documenté dans .planning/PROGRESS_PROPULSPACE.md) :
-- le try/catch silencieux peut masquer des INSERT failures pour les internes.
-- À monitorer (logs Supabase, chercher "handle_new_user INSERT failed").

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Skip si l'email correspond à un contact portail Propul'Space.
  -- Le client n'a pas besoin d'une row dans public.users (réservée aux
  -- internes Propul'SEO admin/sales/manager).
  IF EXISTS (
    SELECT 1 FROM public.projects_v2 WHERE portal_client_email = new.email
  ) THEN
    RETURN new;
  END IF;

  -- Internes : tente la création, ne bloque pas l'auth si ça échoue.
  BEGIN
    INSERT INTO public.users (auth_user_id, name, email)
    VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user INSERT failed for %: %', new.email, SQLERRM;
  END;

  RETURN new;
END;
$function$;
