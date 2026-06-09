import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

export type SignaturePreview =
  | { kind: 'pdf'; url: string }        // PDF signe -> apercu in-app
  | { kind: 'external'; url: string }   // page DocuSeal -> nouvel onglet
  | null;

// Aucune URL de contrat original n'est stockee : on previsualise le PDF signe
// si dispo, sinon on ouvre la page DocuSeal du document.
export function signaturePreviewTarget(s: PortalSignature): SignaturePreview {
  if (s.docuseal_signed_pdf_url) return { kind: 'pdf', url: s.docuseal_signed_pdf_url };
  if (s.docuseal_signing_url) return { kind: 'external', url: s.docuseal_signing_url };
  return null;
}
