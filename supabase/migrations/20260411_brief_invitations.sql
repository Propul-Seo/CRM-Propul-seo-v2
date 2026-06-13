-- supabase/migrations/20260411_brief_invitations.sql

create table brief_invitations (
  id            uuid primary key default gen_random_uuid(),
  token         uuid not null unique default gen_random_uuid(),
  company_name  text,
  status        text not null default 'pending'
                  check (status = any(array['pending'::text, 'submitted'::text])),
  created_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  project_id    uuid references projects_v2(id) on delete set null
);

alter table brief_invitations enable row level security;

-- Anon peut lire les invitations en attente (pour valider le token côté client)
create policy "anon_read_pending" on brief_invitations
  for select
  to anon
  using (status = 'pending');

-- Utilisateurs authentifiés peuvent tout faire (admins CRM)
create policy "auth_all" on brief_invitations
  for all
  to authenticated
  using (true)
  with check (true);

-- Anon peut insérer (l'app n'utilise pas l'auth Supabase JWT)
create policy "anon_insert" on brief_invitations
  for insert
  to anon
  with check (true);
