-- propulspace 295 — cycle de vie facture : numéro à l'envoi, suppression brouillon, annulation.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

-- 1. Numéro facultatif (le brouillon n'a pas de numéro avant l'envoi).
alter table propulspace.invoices alter column invoice_number drop not null;

-- 2. Traçabilité de l'annulation.
alter table propulspace.invoices add column if not exists cancellation_reason text;
alter table propulspace.invoices add column if not exists cancelled_at timestamptz;

-- 3. Création : ne plus consommer de numéro (insérer NULL). Corps identique à la 270
--    hormis le numéro.
create or replace function public.admin_create_invoice(
  p_project_id          uuid,
  p_amount_subtotal     numeric,
  p_is_deposit          boolean default false,
  p_vat_rate            numeric default 0,
  p_line_items          jsonb   default '[]'::jsonb,
  p_issue_date          date    default current_date,
  p_due_date            date    default null,
  p_client_visible_notes text   default null,
  p_internal_notes      text    default null,
  p_installments        jsonb   default '[]'::jsonb
) returns uuid
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare
  v_invoice_id uuid; v_amount_vat numeric; v_total numeric;
  v_snapshot jsonb; v_inst jsonb; v_idx int := 0; v_creator uuid;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;

  select jsonb_build_object(
           'company',    coalesce(client_company, name),
           'first_name', client_first_name,
           'phone',      client_phone,
           'email',      portal_client_email
         )
    into v_snapshot from public.projects_v2 where id = p_project_id;
  if v_snapshot is null then
    raise exception 'project % not found', p_project_id using errcode = 'P0002';
  end if;

  select id into v_creator from public.users where auth_user_id = auth.uid();
  v_amount_vat := round(p_amount_subtotal * p_vat_rate / 100.0, 2);
  v_total      := p_amount_subtotal + v_amount_vat;

  insert into propulspace.invoices(
    invoice_number, project_id, client_snapshot, is_deposit,
    amount_subtotal, vat_rate, amount_vat, amount_total, currency,
    line_items, status, issue_date, due_date,
    client_visible_notes, internal_notes, created_by
  ) values (
    null, p_project_id, v_snapshot, p_is_deposit,
    p_amount_subtotal, p_vat_rate, v_amount_vat, v_total, 'EUR',
    coalesce(p_line_items,'[]'::jsonb), 'draft', p_issue_date,
    coalesce(p_due_date, p_issue_date + 30),
    p_client_visible_notes, p_internal_notes, v_creator
  ) returning id into v_invoice_id;

  for v_inst in select * from jsonb_array_elements(coalesce(p_installments,'[]'::jsonb))
  loop
    v_idx := v_idx + 1;
    insert into propulspace.invoice_installments(
      invoice_id, installment_number, label, amount, due_date, status
    ) values (
      v_invoice_id, v_idx,
      coalesce(v_inst->>'label', 'Acompte ' || v_idx),
      (v_inst->>'amount')::numeric,
      coalesce((v_inst->>'due_date')::date, p_issue_date + 30),
      'pending'
    );
  end loop;

  return v_invoice_id;
end; $$;

-- 4. Envoi : attribue le numéro (si absent) et renvoie le numéro.
--    DROP obligatoire car le type de retour change (void -> text).
drop function if exists public.admin_send_invoice(uuid);
create function public.admin_send_invoice(p_invoice_id uuid)
returns text
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text; v_number text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status, invoice_number into v_status, v_number
    from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then raise exception 'invoice already sent (status=%)', v_status using errcode='42501'; end if;
  if v_number is null then v_number := propulspace.next_invoice_number(); end if;
  update propulspace.invoices
     set invoice_number = v_number, status = 'sent', is_locked = true, updated_at = now()
   where id = p_invoice_id;
  return v_number;
end; $$;

-- 5. Suppression d'un brouillon (acomptes en cascade via FK ON DELETE CASCADE).
create or replace function public.admin_delete_invoice(p_invoice_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then
    raise exception 'only draft invoices can be deleted (status=%)', v_status using errcode='42501';
  end if;
  delete from propulspace.invoices where id = p_invoice_id;
end; $$;

-- 6. Annulation simple : facture envoyée/en retard et NON payée.
create or replace function public.admin_cancel_invoice(p_invoice_id uuid, p_reason text default null)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text; v_paid timestamptz;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status, paid_at into v_status, v_paid
    from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status not in ('sent','overdue') or v_paid is not null then
    raise exception 'invoice not cancellable (status=%)', v_status using errcode='42501';
  end if;
  update propulspace.invoices
     set status = 'cancelled', cancellation_reason = p_reason, cancelled_at = now(), updated_at = now()
   where id = p_invoice_id;
end; $$;

-- 7. Droits (le DROP de admin_send_invoice a effacé ses grants → les reposer).
revoke all on function public.admin_send_invoice(uuid)        from public, anon;
revoke all on function public.admin_delete_invoice(uuid)      from public, anon;
revoke all on function public.admin_cancel_invoice(uuid,text) from public, anon;
grant execute on function public.admin_send_invoice(uuid)        to authenticated;
grant execute on function public.admin_delete_invoice(uuid)      to authenticated;
grant execute on function public.admin_cancel_invoice(uuid,text) to authenticated;
