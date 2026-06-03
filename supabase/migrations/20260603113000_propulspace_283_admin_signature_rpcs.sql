-- propulspace 283 — RPC admin: annulation de signature.
-- La CRÉATION passe par l'edge fn admin-docuseal-create-submission (DocuSeal API) ;
-- la synchro signed/declined/expired arrive par l'edge fn docuseal-webhook.
-- Ici : annuler une signature ENCORE en attente. Une signature signée est permanente.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.

create or replace function public.admin_cancel_signature(
  p_signature_id uuid,
  p_reason       text default null
) returns void
language plpgsql security definer
set search_path = 'public','propulspace','pg_temp'
as $$
declare v_status text;
begin
  if not propulspace.is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select status into v_status from propulspace.signatures where id = p_signature_id;
  if v_status is null then raise exception 'signature not found' using errcode='P0002'; end if;
  if v_status <> 'pending' then
    raise exception 'signature not cancellable (status=%)', v_status using errcode='42501';
  end if;
  update propulspace.signatures
     set status = 'cancelled', declined_at = now(), decline_reason = p_reason, updated_at = now()
   where id = p_signature_id;
end; $$;

revoke all on function public.admin_cancel_signature(uuid,text) from public, anon;
grant execute on function public.admin_cancel_signature(uuid,text) to authenticated;
