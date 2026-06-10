import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

// Signature maison (SES) : le PDF signé est stocké dans le bucket
// `propulspace-documents` (chemin storage). On renvoie ce chemin, à résoudre en
// URL signée par l'appelant (getAdminSignedUrl). Tant que la signature est en
// attente, il n'y a pas de PDF signé → null (la source se consulte dans Documents).
export function signedPdfPath(s: PortalSignature): string | null {
  return s.signed_pdf_url ?? null;
}
