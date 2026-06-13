-- supabase/migrations/20260411_notification_emails.sql

create table if not exists notification_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint notification_emails_email_unique unique (email)
);

-- RLS : lecture/écriture réservée aux admins
alter table notification_emails enable row level security;

create policy "admins_all" on notification_emails
  for all
  using (is_admin())
  with check (is_admin());
