-- propulspace 282 — RPC admin: lecture du journal d'audit.
-- audit_log n'est JAMAIS exposé à PostgREST (pas de vue _v2). Lecture admin-only
-- via cette RPC. Résout l'auteur via public.users (email), 'Client' si non interne.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

create or replace function public.admin_get_audit_log(
  p_project_id    uuid,
  p_limit         int  default 100,
  p_offset        int  default 0,
  p_resource_type text default null
) returns table (
  id            uuid,
  created_at    timestamptz,
  action        text,
  resource_type text,
  resource_id   uuid,
  actor_label   text,
  diff          jsonb
)
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return query
    select
      al.id, al.created_at, al.action, al.resource_type, al.resource_id,
      coalesce(u.email, case when al.user_id is null then 'Client' else 'Système' end) as actor_label,
      al.diff
    from propulspace.audit_log al
    left join public.users u on u.id = al.user_id
    where al.project_id = p_project_id
      and (p_resource_type is null or al.resource_type = p_resource_type)
    order by al.created_at desc
    limit greatest(coalesce(p_limit, 100), 1)
    offset greatest(coalesce(p_offset, 0), 0);
end; $$;

revoke all on function public.admin_get_audit_log(uuid,int,int,text) from public, anon;
grant execute on function public.admin_get_audit_log(uuid,int,int,text) to authenticated;
