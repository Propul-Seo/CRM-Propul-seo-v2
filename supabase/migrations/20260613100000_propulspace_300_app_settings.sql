-- propulspace 300 — réglages clé→jsonb du back-office + RPC admin.
-- Première utilisation : template des jalons types (clé 'project_step_template',
-- éditée dans Réglages du back-office, appliquée par l'onglet Jalons du cockpit).
-- Le schéma propulspace n'est pas exposé à PostgREST → accès uniquement via
-- les RPC SECURITY DEFINER ci-dessous, réservées aux admins (is_admin()).
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

create table if not exists propulspace.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.admin_get_setting(p_key text)
returns jsonb
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return (select value from propulspace.app_settings where key = p_key);
end; $$;

create or replace function public.admin_set_setting(p_key text, p_value jsonb)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_key is null or btrim(p_key) = '' then raise exception 'key required' using errcode='22023'; end if;
  insert into propulspace.app_settings as s (key, value)
  values (p_key, coalesce(p_value, 'null'::jsonb))
  on conflict (key) do update set value = excluded.value, updated_at = now();
end; $$;

revoke all on function public.admin_get_setting(text) from public, anon;
grant execute on function public.admin_get_setting(text) to authenticated;
revoke all on function public.admin_set_setting(text, jsonb) from public, anon;
grant execute on function public.admin_set_setting(text, jsonb) to authenticated;
