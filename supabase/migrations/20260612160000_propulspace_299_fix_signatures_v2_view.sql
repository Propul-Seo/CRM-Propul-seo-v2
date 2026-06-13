-- propulspace 299 — répare la vue legacy public.propulspace_signatures_v2
-- La migration 298 (signature maison SES) droppait les DEUX vues exposées
-- (de-versionnée + legacy _v2) mais ne recréait que la de-versionnée.
-- Or le portail client lit via le proxy v2 → propulspace_signatures_v2.
-- Erreur en prod : relation "public.propulspace_signatures_v2" does not exist.
--
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor).

set search_path = propulspace, public;

-- Même whitelist de colonnes que public.propulspace_signatures (298 §4).
-- security_invoker = true : la RLS de la table source s'applique (parité 190).
create view public.propulspace_signatures_v2
  with (security_invoker = true) as
  select
    id, project_id, document_id, signature_type, name,
    signed_name, signed_pdf_url, status,
    sent_at, signed_at, expires_at, created_at
  from propulspace.signatures;

revoke all on public.propulspace_signatures_v2 from anon;
grant select on public.propulspace_signatures_v2 to authenticated;
