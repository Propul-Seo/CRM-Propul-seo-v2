-- propulspace 296 — intitulé libre de facture (A1) + vue admin dédiée (E1).
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor), après la 295. Ne pas rejouer si déjà passée.
--
-- Contexte : useAdminInvoices lisait la vue CLIENT propulspace_invoices_v2 (colonnes
-- whitelist) → title/cancellation_reason invisibles côté admin. On crée une vraie vue
-- admin exposant toutes les colonnes, filtrée par is_admin() pour éviter toute fuite
-- (les vues sont security_invoker : la RLS contrôle les LIGNES, la vue les COLONNES).

-- 1. Intitulé libre (nullable) — libellé de la facture entière, distinct de is_deposit/label d'acompte.
alter table propulspace.invoices add column if not exists title text;

-- 2. Vue CLIENT : recréer en ajoutant `title` (visible client). Reste inchangé —
--    toujours PAS de cancellation_reason / internal_notes / stripe_* / is_locked côté client.
drop view if exists public.propulspace_invoices_v2;
create view public.propulspace_invoices_v2
  with (security_invoker = true) as
  select
    id, invoice_number, project_id, client_snapshot,
    is_deposit, amount_subtotal, vat_rate, amount_vat, amount_total, currency,
    line_items, status, issue_date, due_date, paid_at,
    stripe_payment_link_url, pdf_url, client_visible_notes, created_at,
    title
  from propulspace.invoices;
-- ⚠️ Tout CREATE VIEW dans public ré-attribue les ACL Supabase par défaut (ALL TO anon).
revoke all on public.propulspace_invoices_v2 from anon;
grant select on public.propulspace_invoices_v2 to authenticated;

-- 3. Vue ADMIN : TOUTES les colonnes, filtrée par is_admin() dans le WHERE.
--    security_invoker = true → un non-admin obtient 0 ligne (is_admin() = false),
--    un admin voit tout (lignes via RLS FOR ALL + colonnes via la vue).
--    ⚠️ SÉCURITÉ — l'étanchéité repose sur DEUX invariants à ne jamais retirer :
--    (a) security_invoker = true (la RLS de l'appelant s'applique),
--    (b) where propulspace.is_admin() (un non-admin obtient 0 ligne).
drop view if exists public.propulspace_invoices_admin_v2;
create view public.propulspace_invoices_admin_v2
  with (security_invoker = true) as
  select
    id, invoice_number, project_id, client_snapshot,
    is_deposit, amount_subtotal, vat_rate, amount_vat, amount_total, currency,
    line_items, status, issue_date, due_date, paid_at,
    stripe_payment_link_url, stripe_payment_link_id, stripe_payment_intent_id, stripe_paid_at,
    pdf_url, pdf_hash_sha256, internal_notes, client_visible_notes,
    is_locked, created_by, created_at, updated_at,
    cancellation_reason, cancelled_at, title
  from propulspace.invoices
  where propulspace.is_admin();
revoke all on public.propulspace_invoices_admin_v2 from anon;
grant select on public.propulspace_invoices_admin_v2 to authenticated;

-- 4. admin_create_invoice : +p_title. DROP obligatoire (la liste d'arguments change →
--    sinon deux surcharges et appels nommés ambigus). Double DROP (ancienne + nouvelle
--    signature) pour rester rejouable malgré le create non-replace.
drop function if exists public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb);
drop function if exists public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb,text);
create function public.admin_create_invoice(
  p_project_id          uuid,
  p_amount_subtotal     numeric,
  p_is_deposit          boolean default false,
  p_vat_rate            numeric default 0,
  p_line_items          jsonb   default '[]'::jsonb,
  p_issue_date          date    default current_date,
  p_due_date            date    default null,
  p_client_visible_notes text   default null,
  p_internal_notes      text    default null,
  p_installments        jsonb   default '[]'::jsonb,
  p_title               text    default null
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
    client_visible_notes, internal_notes, created_by, title
  ) values (
    null, p_project_id, v_snapshot, p_is_deposit,
    p_amount_subtotal, p_vat_rate, v_amount_vat, v_total, 'EUR',
    coalesce(p_line_items,'[]'::jsonb), 'draft', p_issue_date,
    coalesce(p_due_date, p_issue_date + 30),
    p_client_visible_notes, p_internal_notes, v_creator, p_title
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

-- 5. admin_update_invoice : +p_title (coalesce → null conserve l'existant, cohérent
--    avec les autres champs). DROP obligatoire (liste d'arguments change). Double DROP
--    (ancienne + nouvelle signature) pour rester rejouable.
drop function if exists public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text);
drop function if exists public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text,text);
create function public.admin_update_invoice(
  p_invoice_id           uuid,
  p_amount_subtotal      numeric default null,
  p_vat_rate             numeric default null,
  p_line_items           jsonb   default null,
  p_due_date             date    default null,
  p_client_visible_notes text    default null,
  p_internal_notes       text    default null,
  p_title                text    default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text; v_sub numeric; v_rate numeric;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then raise exception 'invoice not editable (status=%)', v_status using errcode='42501'; end if;

  update propulspace.invoices set
    amount_subtotal      = coalesce(p_amount_subtotal, amount_subtotal),
    vat_rate             = coalesce(p_vat_rate, vat_rate),
    line_items           = coalesce(p_line_items, line_items),
    due_date             = coalesce(p_due_date, due_date),
    client_visible_notes = coalesce(p_client_visible_notes, client_visible_notes),
    internal_notes       = coalesce(p_internal_notes, internal_notes),
    title                = coalesce(p_title, title),
    updated_at           = now()
  where id = p_invoice_id;

  select amount_subtotal, vat_rate into v_sub, v_rate from propulspace.invoices where id = p_invoice_id;
  update propulspace.invoices set
    amount_vat   = round(v_sub * v_rate / 100.0, 2),
    amount_total = v_sub + round(v_sub * v_rate / 100.0, 2)
  where id = p_invoice_id;
end; $$;

-- 6. Droits (les DROP ont effacé les grants → les reposer).
revoke all on function public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb,text) from public, anon;
revoke all on function public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text,text) from public, anon;
grant execute on function public.admin_create_invoice(uuid,numeric,boolean,numeric,jsonb,date,date,text,text,jsonb,text) to authenticated;
grant execute on function public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text,text) to authenticated;
