-- propulspace 298 — Signature électronique maison (SES, Niveau 1)
-- DocuSeal -> signature électronique simple maison.
--   • retire les colonnes DocuSeal, ajoute le journal de preuve,
--   • RPC admin_create_signature,
--   • ⚠️ gère la CASCADE : la vue exposée public.propulspace_signatures sélectionne
--     docuseal_signing_url / docuseal_signed_pdf_url → on la DROP avant d'altérer la
--     table, puis on la RECRÉE alignée sur la nouvelle forme.
--
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor).
-- ⚠️ PRÉ-CHECK conseillé avant d'exécuter (voir bloc commenté en bas) pour confirmer
--    qu'aucun AUTRE objet ne dépend des colonnes DocuSeal.

set search_path = propulspace, public;

-- 0. Drop des vues exposées qui dépendent des colonnes DocuSeal (sinon DROP COLUMN échoue).
--    Les deux noms sont gérés (de-versionné + legacy _v2). Recréées en section 4.
drop view if exists public.propulspace_signatures;
drop view if exists public.propulspace_signatures_v2;

-- 1. Colonnes DocuSeal devenues inutiles (aucune donnée en prod)
alter table propulspace.signatures
  drop column if exists docuseal_submission_id,
  drop column if exists docuseal_template_id,
  drop column if exists docuseal_signing_url;

-- 2. PDF signé : nom provider-agnostic (rename idempotent)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'propulspace' and table_name = 'signatures'
      and column_name = 'docuseal_signed_pdf_url'
  ) then
    alter table propulspace.signatures rename column docuseal_signed_pdf_url to signed_pdf_url;
  end if;
end $$;

-- 3. Journal de preuve
alter table propulspace.signatures
  add column if not exists signed_name      text,
  add column if not exists signer_email     text,
  add column if not exists signature_image  text,        -- chemin storage du PNG de signature
  add column if not exists consent_at       timestamptz,
  add column if not exists document_sha256  text;

-- 4. Recrée la vue exposée (whitelist alignée sur PortalSignature, sans DocuSeal).
--    security_invoker = true : la RLS de la table source s'applique (parité 190).
create view public.propulspace_signatures
  with (security_invoker = true) as
  select
    id, project_id, document_id, signature_type, name,
    signed_name, signed_pdf_url, status,
    sent_at, signed_at, expires_at, created_at
  from propulspace.signatures;

revoke all on public.propulspace_signatures from anon;
grant select on public.propulspace_signatures to authenticated;

-- 5. RPC admin : créer une demande de signature sur un document du projet.
create or replace function public.admin_create_signature(
  p_project_id     uuid,
  p_document_id    uuid,
  p_signature_type text,
  p_name           text,
  p_signer_email   text
) returns uuid
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_id uuid; v_actor uuid;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_signature_type not in ('quote','contract','addendum','other') then
    raise exception 'invalid signature_type' using errcode = '22023';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name required' using errcode = '22023';
  end if;
  if coalesce(trim(p_signer_email), '') = '' then
    raise exception 'signer_email required' using errcode = '22023';
  end if;

  select id into v_actor from public.users where auth_user_id = auth.uid();

  insert into propulspace.signatures (
    project_id, document_id, signature_type, name, signer_email, status, sent_at, created_by
  ) values (
    p_project_id, p_document_id, p_signature_type, trim(p_name),
    lower(trim(p_signer_email)), 'pending', now(), v_actor
  ) returning id into v_id;

  return v_id;
end; $$;

revoke all on function public.admin_create_signature(uuid,uuid,text,text,text) from public, anon;
grant execute on function public.admin_create_signature(uuid,uuid,text,text,text) to authenticated;

-- ============================================================================
-- PRÉ-CHECK (à exécuter SÉPARÉMENT avant la migration, ne modifie rien) :
-- liste tous les objets qui dépendent des colonnes DocuSeal. On s'attend à n'y
-- voir QUE des vues (propulspace_signatures / _v2). Si autre chose apparaît
-- (RLS, autre vue, colonne générée), me le signaler avant d'appliquer.
-- ----------------------------------------------------------------------------
-- select distinct dep.relname as objet, dep.relkind as type
-- from pg_depend d
-- join pg_rewrite r on r.oid = d.objid
-- join pg_class dep on dep.oid = r.ev_class
-- join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
-- where d.refobjid = 'propulspace.signatures'::regclass
--   and a.attname like 'docuseal\_%';
-- ============================================================================
