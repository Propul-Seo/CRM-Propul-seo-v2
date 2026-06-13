-- propulspace 272 — l'edge generate-invoice-pdf écrit le chemin PDF + hash via cette RPC
-- (appelée avec le JWT admin ; le service_role ne traverse pas les vues _v2).
create or replace function public.admin_set_invoice_pdf(
  p_invoice_id uuid, p_url text, p_hash text
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  update propulspace.invoices set pdf_url = p_url, pdf_hash_sha256 = p_hash, updated_at = now()
   where id = p_invoice_id;
end; $$;

revoke all on function public.admin_set_invoice_pdf(uuid,text,text) from public, anon;
grant execute on function public.admin_set_invoice_pdf(uuid,text,text) to authenticated;
