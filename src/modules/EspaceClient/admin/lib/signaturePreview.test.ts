import { describe, it, expect } from 'vitest';
import { signaturePreviewTarget } from './signaturePreview';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

const base: PortalSignature = {
  id: '1', project_id: 'p', document_id: null, signature_type: 'contract', name: 'Contrat',
  docuseal_signing_url: null, docuseal_signed_pdf_url: null, status: 'pending',
  sent_at: null, signed_at: null, expires_at: null, created_at: '',
};

describe('signaturePreviewTarget', () => {
  it('priorise le PDF signe', () => {
    expect(signaturePreviewTarget({ ...base, docuseal_signed_pdf_url: 'pdf', docuseal_signing_url: 'sign' }))
      .toEqual({ kind: 'pdf', url: 'pdf' });
  });
  it('retombe sur le lien DocuSeal si pas de PDF signe', () => {
    expect(signaturePreviewTarget({ ...base, docuseal_signing_url: 'sign' }))
      .toEqual({ kind: 'external', url: 'sign' });
  });
  it('renvoie null si aucune URL', () => {
    expect(signaturePreviewTarget(base)).toBeNull();
  });
});
