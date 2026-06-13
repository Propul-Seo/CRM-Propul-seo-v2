-- propulspace 270 — RPC admin: création atomique facture + acomptes.
-- Le schéma propulspace n'étant pas exposé à PostgREST, l'admin écrit via cette
-- RPC public SECURITY DEFINER (garde is_admin). Numéro via next_invoice_number(),
-- snapshot client immuable depuis projects_v2, totaux recalculés serveur.
--
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.
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
  p_installments        jsonb   default '[]'::jsonb   -- [{label, amount, due_date}]
) returns uuid
language plpgsql
security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare
  v_invoice_id uuid;
  v_number     text;
  v_amount_vat numeric;
  v_total      numeric;
  v_snapshot   jsonb;
  v_inst       jsonb;
  v_idx        int := 0;
  v_creator    uuid;
begin
  if not propulspace.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
           'company',    coalesce(client_company, name),
           'first_name', client_first_name,
           'phone',      client_phone,
           'email',      portal_client_email
         )
    into v_snapshot
    from public.projects_v2
   where id = p_project_id;

  if v_snapshot is null then
    raise exception 'project % not found', p_project_id using errcode = 'P0002';
  end if;

  select id into v_creator from public.users where auth_user_id = auth.uid();

  v_number     := propulspace.next_invoice_number();
  v_amount_vat := round(p_amount_subtotal * p_vat_rate / 100.0, 2);
  v_total      := p_amount_subtotal + v_amount_vat;

  insert into propulspace.invoices(
    invoice_number, project_id, client_snapshot, is_deposit,
    amount_subtotal, vat_rate, amount_vat, amount_total, currency,
    line_items, status, issue_date, due_date,
    client_visible_notes, internal_notes, created_by
  ) values (
    v_number, p_project_id, v_snapshot, p_is_deposit,
    p_amount_subtotal, p_vat_rate, v_amount_vat, v_total, 'EUR',
    coalesce(p_line_items,'[]'::jsonb), 'draft', p_issue_date,
    coalesce(p_due_date, p_issue_date + 30),
    p_client_visible_notes, p_internal_notes, v_creator
  )
  returning id into v_invoice_id;

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
end;
$$;

revoke all on function public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb) from public, anon;
grant execute on function public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb) to authenticated;
