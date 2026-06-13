-- Comptabilité Phase 2 — Feature A : statut de paiement & impayés
-- Ajoute le suivi des créances clients sur accounting_entries.
-- Exécutée à la main dans le SQL Editor Supabase (projet CRM) le 2026-06-02.
-- Idempotent. RLS inchangée : les policies existantes couvrent les nouvelles colonnes
-- (lecture/insert = can_view_finance, update/delete = is_admin). « overdue » n'est pas
-- stocké mais calculé côté front (pending + due_date < aujourd'hui).

-- 1) Colonnes
ALTER TABLE public.accounting_entries
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS due_date     date,
  ADD COLUMN IF NOT EXISTS payment_date date;

-- 2) Contrainte de validité (rejouable)
ALTER TABLE public.accounting_entries DROP CONSTRAINT IF EXISTS chk_payment_status;
ALTER TABLE public.accounting_entries
  ADD CONSTRAINT chk_payment_status
  CHECK (payment_status IN ('paid', 'pending', 'overdue'));

-- 3) Backfill : tout l'existant = payé
UPDATE public.accounting_entries SET payment_status = 'paid' WHERE payment_status IS NULL;

-- 4) Date d'encaissement = date d'écriture pour l'existant payé
UPDATE public.accounting_entries
SET payment_date = entry_date
WHERE payment_status = 'paid' AND payment_date IS NULL;

-- 5) Index pour les requêtes « impayés »
CREATE INDEX IF NOT EXISTS idx_accounting_entries_payment_status ON public.accounting_entries(payment_status);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_due_date       ON public.accounting_entries(due_date);
