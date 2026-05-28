-- ============================================================================
-- Migration 210 — Sprint B.3.1 : préparation paiements Stripe
-- ============================================================================
-- - Ajoute le statut 'partially_paid' à propulspace.invoices.
-- - Ajoute les colonnes Stripe (customer, checkout session, payment intent)
--   nécessaires côté code, sur invoices ET invoice_installments.
-- - Crée un trigger qui recalcule automatiquement invoices.status lorsque
--   les installments changent : tous paid → 'paid', certains paid → 'partially_paid',
--   aucun paid → status actuel inchangé. Ne touche pas draft/cancelled/refunded.
--
-- La table propulspace.stripe_webhook_events existe déjà (migration 060) avec
-- contrainte UNIQUE sur stripe_event_id (idempotence webhook).
-- ============================================================================

-- 1. Élargir le check sur invoices.status pour autoriser 'partially_paid'
ALTER TABLE propulspace.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE propulspace.invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'));

-- 2. Colonnes Stripe
ALTER TABLE propulspace.invoices
  ADD COLUMN IF NOT EXISTS stripe_customer_id         TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

ALTER TABLE propulspace.invoice_installments
  ADD COLUMN IF NOT EXISTS stripe_customer_id         TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_paid_at             TIMESTAMPTZ;

-- Index partiels (uniques sur stripe_checkout_session_id pour éviter qu'une
-- session soit liée à 2 factures par erreur)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invoices_stripe_session
  ON propulspace.invoices(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_installments_stripe_session
  ON propulspace.invoice_installments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- 3. Trigger recalcul invoices.status depuis installments
-- Logique :
--   - Si invoice.status IN (draft, cancelled, refunded) : no-op (admin only)
--   - Si 0 installment : no-op
--   - Si tous installments paid → invoice.paid + paid_at
--   - Si au moins 1 paid mais pas tous → invoice.partially_paid
--   - Si aucun paid → on garde sent/overdue (pas de downgrade auto)
--
-- Edge case connu (review H-3) : si TOUS les installments d'une facture
-- déjà 'paid' sont DELETE en série, le compteur v_total_inst tombe à 0
-- et la facture reste en 'paid' (le no-op skip). Aucune contrainte DB ne
-- l'empêche. En pratique l'admin n'a aucune raison de supprimer des
-- installments paid — à interdire au niveau UI quand le futur écran admin
-- de gestion factures sera développé (Sprint C).

CREATE OR REPLACE FUNCTION propulspace.recalc_invoice_status_from_installments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, pg_temp
AS $fn$
DECLARE
  v_invoice_id     UUID;
  v_current_status TEXT;
  v_total_inst     INT;
  v_paid_inst      INT;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF v_invoice_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT status INTO v_current_status FROM propulspace.invoices WHERE id = v_invoice_id;
  IF v_current_status IS NULL OR v_current_status IN ('draft', 'cancelled', 'refunded') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'paid')
    INTO v_total_inst, v_paid_inst
    FROM propulspace.invoice_installments
    WHERE invoice_id = v_invoice_id;

  IF v_total_inst = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_paid_inst = v_total_inst THEN
    UPDATE propulspace.invoices
      SET status = 'paid', paid_at = COALESCE(paid_at, NOW())
      WHERE id = v_invoice_id AND status <> 'paid';
  ELSIF v_paid_inst > 0 THEN
    UPDATE propulspace.invoices
      SET status = 'partially_paid'
      WHERE id = v_invoice_id AND status NOT IN ('partially_paid', 'paid');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

DROP TRIGGER IF EXISTS trg_recalc_invoice_status ON propulspace.invoice_installments;
CREATE TRIGGER trg_recalc_invoice_status
  AFTER INSERT OR UPDATE OF status OR DELETE ON propulspace.invoice_installments
  FOR EACH ROW EXECUTE FUNCTION propulspace.recalc_invoice_status_from_installments();

COMMENT ON FUNCTION propulspace.recalc_invoice_status_from_installments() IS
  'B.3.1 — recalcule automatiquement propulspace.invoices.status (sent/partially_paid/paid) depuis l''état de ses installments. Skip draft/cancelled/refunded.';

-- ============================================================================
-- ROLLBACK (commenté)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_recalc_invoice_status ON propulspace.invoice_installments;
-- DROP FUNCTION IF EXISTS propulspace.recalc_invoice_status_from_installments();
-- DROP INDEX IF EXISTS propulspace.uniq_invoices_stripe_session;
-- DROP INDEX IF EXISTS propulspace.uniq_installments_stripe_session;
-- ALTER TABLE propulspace.invoice_installments
--   DROP COLUMN IF EXISTS stripe_customer_id,
--   DROP COLUMN IF EXISTS stripe_checkout_session_id,
--   DROP COLUMN IF EXISTS stripe_payment_intent_id,
--   DROP COLUMN IF EXISTS stripe_paid_at;
-- ALTER TABLE propulspace.invoices
--   DROP COLUMN IF EXISTS stripe_customer_id,
--   DROP COLUMN IF EXISTS stripe_checkout_session_id;
-- ALTER TABLE propulspace.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
-- ALTER TABLE propulspace.invoices ADD CONSTRAINT invoices_status_check
--   CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'));
