-- 266 — R-014 : retirer silent catch dans handle_new_user
-- Le bloc EXCEPTION WHEN OTHERS THEN NULL masquait les INSERT failures dans
-- public.users. On le remplace par RAISE WARNING (non bloquant — la création
-- du compte auth doit réussir même si l'INSERT public.users plante).
-- Note : la fonction avait déjà été corrigée via propulspace_150_skip_portal_clients.
-- Cette migration versionne explicitement R-014 et ajoute le COMMENT ON FUNCTION.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'propulspace', 'pg_temp'
AS $$
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user failed for auth_user_id=%: % (SQLSTATE %)',
        NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'R-014 : silent catch remplacé par RAISE WARNING — les échecs INSERT users sont maintenant visibles dans les logs Supabase.';
