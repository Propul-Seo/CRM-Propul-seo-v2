/**
 * Transactional email — Brevo placeholder.
 *
 * PHASE 3: replace the body with a real Brevo API call.
 * Until then this logs to console so flows can be tested end-to-end.
 */
export async function sendTransactionalEmail(
  type: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; placeholder: boolean }> {
  console.log(`[PLACEHOLDER-BREVO] Would send email: ${type}`, data);
  return { success: true, placeholder: true };
}
