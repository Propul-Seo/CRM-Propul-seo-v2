-- propulspace 271 — édition brouillon, envoi (status->sent + verrou), immuabilité.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor), après la 270.

create or replace function public.admin_update_invoice(
  p_invoice_id           uuid,
  p_amount_subtotal      numeric default null,
  p_vat_rate             numeric default null,
  p_line_items           jsonb   default null,
  p_due_date             date    default null,
  p_client_visible_notes text    default null,
  p_internal_notes       text    default null
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
    updated_at           = now()
  where id = p_invoice_id;

  select amount_subtotal, vat_rate into v_sub, v_rate from propulspace.invoices where id = p_invoice_id;
  update propulspace.invoices set
    amount_vat   = round(v_sub * v_rate / 100.0, 2),
    amount_total = v_sub + round(v_sub * v_rate / 100.0, 2)
  where id = p_invoice_id;
end; $$;

create or replace function public.admin_send_invoice(p_invoice_id uuid)
returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.invoices where id = p_invoice_id;
  if v_status is null then raise exception 'invoice not found' using errcode='P0002'; end if;
  if v_status <> 'draft' then raise exception 'invoice already sent (status=%)', v_status using errcode='42501'; end if;
  update propulspace.invoices
     set status = 'sent', is_locked = true, updated_at = now()
   where id = p_invoice_id;
end; $$;

-- Immuabilité : une facture verrouillée n'autorise que les transitions de paiement
-- (status/paid_at/stripe_* posés par le webhook service_role).
create or replace function propulspace.tg_invoice_immutable()
returns trigger language plpgsql as $$
begin
  if old.is_locked then
    if new.amount_total    is distinct from old.amount_total
    or new.amount_subtotal is distinct from old.amount_subtotal
    or new.line_items      is distinct from old.line_items
    or new.invoice_number  is distinct from old.invoice_number
    or new.client_snapshot is distinct from old.client_snapshot then
      raise exception 'facture % verrouillée (art. 293 B)', old.invoice_number using errcode='42501';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_invoice_immutable on propulspace.invoices;
create trigger trg_invoice_immutable
  before update on propulspace.invoices
  for each row execute function propulspace.tg_invoice_immutable();

revoke all on function public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text) from public, anon;
revoke all on function public.admin_send_invoice(uuid) from public, anon;
grant execute on function public.admin_update_invoice(uuid,numeric,numeric,jsonb,date,text,text) to authenticated;
grant execute on function public.admin_send_invoice(uuid) to authenticated;
