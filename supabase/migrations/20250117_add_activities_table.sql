-- Créer la table activities pour le calendrier centralisé
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date_utc timestamptz not null,
  type text not null check (type in ('projet', 'prospect')),
  priority text not null check (priority in ('haute', 'moyenne', 'basse')),
  status text not null check (status in ('a_faire', 'en_cours', 'termine')),
  related_id uuid not null,
  related_module text not null check (related_module in ('projet', 'crm')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Créer des index pour optimiser les requêtes
create index if not exists activities_date_idx on public.activities (date_utc);
create index if not exists activities_type_idx on public.activities (type);
create index if not exists activities_status_idx on public.activities (status);
create index if not exists activities_related_idx on public.activities (related_id, related_module);

-- Activer RLS (Row Level Security)
alter table public.activities enable row level security;

-- Créer une politique RLS pour permettre l'accès authentifié
create policy "Users can view all activities" on public.activities
  for select using (true);

create policy "Users can insert activities" on public.activities
  for insert with check (true);

create policy "Users can update activities" on public.activities
  for update using (true);

create policy "Users can delete activities" on public.activities
  for delete using (true);

-- Créer une fonction pour mettre à jour automatiquement updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Créer le trigger pour updated_at
create trigger handle_activities_updated_at
  before update on public.activities
  for each row
  execute function public.handle_updated_at(); 