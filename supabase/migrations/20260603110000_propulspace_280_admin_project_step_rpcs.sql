-- propulspace 280 — RPC admin: gestion des jalons (project_steps).
-- Le schéma propulspace n'étant pas exposé à PostgREST, l'admin écrit via ces
-- RPC public SECURITY DEFINER (garde is_admin). project_steps n'a PAS de trigger
-- d'audit (table non sensible) → mutations directes.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

create or replace function public.admin_create_project_step(
  p_project_id        uuid,
  p_label             text,
  p_step_order        int     default null,
  p_status            text    default 'upcoming',
  p_description       text    default null,
  p_date_start        date    default null,
  p_date_planned_end  date    default null,
  p_date_actual_end   date    default null,
  p_visible_to_client boolean default true
) returns uuid
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_id uuid; v_order int;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_status not in ('upcoming','in_progress','completed','blocked') then
    raise exception 'invalid status %', p_status using errcode='22023';
  end if;
  if not exists (select 1 from public.projects_v2 where id = p_project_id) then
    raise exception 'project % not found', p_project_id using errcode='P0002';
  end if;
  v_order := coalesce(
    p_step_order,
    (select coalesce(max(step_order), 0) + 1 from propulspace.project_steps where project_id = p_project_id)
  );
  insert into propulspace.project_steps(
    project_id, step_order, label, description, status,
    date_start, date_planned_end, date_actual_end, visible_to_client
  ) values (
    p_project_id, v_order, p_label, p_description, p_status,
    p_date_start, p_date_planned_end, p_date_actual_end, p_visible_to_client
  ) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.admin_update_project_step(
  p_step_id           uuid,
  p_label             text    default null,
  p_status            text    default null,
  p_description       text    default null,
  p_date_start        date    default null,
  p_date_planned_end  date    default null,
  p_date_actual_end   date    default null,
  p_visible_to_client boolean default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_status is not null and p_status not in ('upcoming','in_progress','completed','blocked') then
    raise exception 'invalid status %', p_status using errcode='22023';
  end if;
  if not exists (select 1 from propulspace.project_steps where id = p_step_id) then
    raise exception 'step % not found', p_step_id using errcode='P0002';
  end if;
  update propulspace.project_steps set
    label             = coalesce(p_label, label),
    status            = coalesce(p_status, status),
    description       = coalesce(p_description, description),
    date_start        = coalesce(p_date_start, date_start),
    date_planned_end  = coalesce(p_date_planned_end, date_planned_end),
    date_actual_end   = coalesce(p_date_actual_end, date_actual_end),
    visible_to_client = coalesce(p_visible_to_client, visible_to_client),
    updated_at        = now()
  where id = p_step_id;
end; $$;

create or replace function public.admin_delete_project_step(p_step_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  delete from propulspace.project_steps where id = p_step_id;
end; $$;

create or replace function public.admin_reorder_project_steps(
  p_project_id  uuid,
  p_ordered_ids uuid[]
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_id uuid; v_idx int := 0;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  foreach v_id in array p_ordered_ids loop
    v_idx := v_idx + 1;
    update propulspace.project_steps
       set step_order = v_idx, updated_at = now()
     where id = v_id and project_id = p_project_id;
  end loop;
end; $$;

revoke all on function public.admin_create_project_step(uuid,text,int,text,text,date,date,date,boolean) from public, anon;
revoke all on function public.admin_update_project_step(uuid,text,text,text,date,date,date,boolean) from public, anon;
revoke all on function public.admin_delete_project_step(uuid) from public, anon;
revoke all on function public.admin_reorder_project_steps(uuid,uuid[]) from public, anon;
grant execute on function public.admin_create_project_step(uuid,text,int,text,text,date,date,date,boolean) to authenticated;
grant execute on function public.admin_update_project_step(uuid,text,text,text,date,date,date,boolean) to authenticated;
grant execute on function public.admin_delete_project_step(uuid) to authenticated;
grant execute on function public.admin_reorder_project_steps(uuid,uuid[]) to authenticated;
