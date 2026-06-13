/**
 * Stripe Payment Link — placeholder.
 *
 * PHASE 3: replace with Stripe API call (POST /v1/payment_links).
 * Returns { url: null } in Phase 2 — callers must handle the null URL by
 * showing a "Coming soon" toast.
 */
export async function createPaymentLink(
  invoiceId: string,
  amount: number,
  description: string,
): Promise<{ url: string | null; placeholder: boolean }> {
  console.log(
    `[PLACEHOLDER-STRIPE] Would create payment link for invoice ${invoiceId}: ${amount}€ — ${description}`,
  );
  return { url: null, placeholder: true };
}
