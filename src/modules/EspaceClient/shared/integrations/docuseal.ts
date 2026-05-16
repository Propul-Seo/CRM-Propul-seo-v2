/**
 * DocuSeal e-signature — placeholder.
 *
 * PHASE 3: replace with DocuSeal API call to create a submission and
 * return the signing URL. Returns { signingUrl: null } in Phase 2.
 */
export async function sendForSignature(
  signatureId: string,
  templateId: string,
  signerEmail: string,
): Promise<{ signingUrl: string | null; placeholder: boolean }> {
  console.log(
    `[PLACEHOLDER-DOCUSEAL] Would send for signature: ${signatureId} (template=${templateId}, signer=${signerEmail})`,
  );
  return { signingUrl: null, placeholder: true };
}
