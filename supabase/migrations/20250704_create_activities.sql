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

create index if not exists activities_date_idx on public.activities (date_utc);
create index if not exists activities_type_idx on public.activities (type); 