-- propulspace 281 — RPC admin GED + vue admin documents.
-- La vue client propulspace_documents_v2 n'expose PAS deleted_at (whitelist 190)
-- et n'a pas de filtre de lignes → un doc soft-supprimé y resterait visible.
-- On crée donc propulspace_documents_admin_v2 (filtre deleted_at IS NULL) que
-- l'admin lit. RLS via is_admin() (security_invoker). Les triggers d'audit sur
-- propulspace.documents loguent insert/update/delete pour l'onglet Activité.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

-- 1. Vue admin (mêmes colonnes que PortalDocument + filtre soft-delete)
drop view if exists public.propulspace_documents_admin_v2;
create view public.propulspace_documents_admin_v2
  with (security_invoker = true) as
  select
    id, project_id, document_type, category, name, description,
    file_url, file_size_bytes, file_mime_type, version,
    visible_to_client, uploaded_by_client, viewed_by_client_at, created_at
  from propulspace.documents
  where deleted_at is null;

revoke all on public.propulspace_documents_admin_v2 from anon;
grant select on public.propulspace_documents_admin_v2 to authenticated;

-- 2. RPC create
create or replace function public.admin_create_document(
  p_project_id        uuid,
  p_document_type     text,
  p_name              text,
  p_file_url          text,
  p_file_size_bytes   bigint  default null,
  p_file_mime_type    text    default null,
  p_category          text    default null,
  p_description       text    default null,
  p_visible_to_client boolean default true
) returns uuid
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_id uuid; v_creator uuid;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if not exists (select 1 from public.projects_v2 where id = p_project_id) then
    raise exception 'project % not found', p_project_id using errcode='P0002';
  end if;
  select id into v_creator from public.users where auth_user_id = auth.uid();
  insert into propulspace.documents(
    project_id, document_type, name, file_url, file_size_bytes, file_mime_type,
    category, description, visible_to_client, uploaded_by_client, uploaded_by
  ) values (
    p_project_id, p_document_type, p_name, p_file_url, p_file_size_bytes, p_file_mime_type,
    p_category, p_description, p_visible_to_client, false, v_creator
  ) returning id into v_id;
  return v_id;
end; $$;

-- 3. RPC update (métadonnées)
create or replace function public.admin_update_document(
  p_document_id       uuid,
  p_name              text    default null,
  p_category          text    default null,
  p_description       text    default null,
  p_visible_to_client boolean default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if not exists (select 1 from propulspace.documents where id = p_document_id and deleted_at is null) then
    raise exception 'document % not found', p_document_id using errcode='P0002';
  end if;
  -- Deux appelants : (a) édition métadonnée (p_name présent) → pose category/description
  -- tels quels, ce qui PERMET de les vider ; (b) toggle visibilité (p_name null) → ne
  -- touche QUE visible_to_client, sans écraser les métadonnées. D'où le CASE sur p_name.
  update propulspace.documents set
    name              = coalesce(p_name, name),
    category          = case when p_name is null then category    else p_category    end,
    description       = case when p_name is null then description else p_description end,
    visible_to_client = coalesce(p_visible_to_client, visible_to_client),
    updated_at        = now()
  where id = p_document_id;
end; $$;

-- 4. RPC delete (soft)
create or replace function public.admin_delete_document(p_document_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  update propulspace.documents set deleted_at = now(), updated_at = now()
   where id = p_document_id and deleted_at is null;
end; $$;

revoke all on function public.admin_create_document(uuid,text,text,text,bigint,text,text,text,boolean) from public, anon;
revoke all on function public.admin_update_document(uuid,text,text,text,boolean) from public, anon;
revoke all on function public.admin_delete_document(uuid) from public, anon;
grant execute on function public.admin_create_document(uuid,text,text,text,bigint,text,text,text,boolean) to authenticated;
grant execute on function public.admin_update_document(uuid,text,text,text,boolean) to authenticated;
grant execute on function public.admin_delete_document(uuid) to authenticated;
