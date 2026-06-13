import { describe, it, expect } from 'vitest';
import { signedPdfPath } from './signaturePreview';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

const base: PortalSignature = {
  id: '1', project_id: 'p', document_id: null, signature_type: 'contract', name: 'Contrat',
  signed_name: null, signed_pdf_url: null, status: 'pending',
  sent_at: null, signed_at: null, expires_at: null, created_at: '',
};

describe('signedPdfPath', () => {
  it('renvoie le chemin du PDF signé', () => {
    expect(signedPdfPath({ ...base, signed_pdf_url: 'p/signatures/x.pdf' })).toBe('p/signatures/x.pdf');
  });
  it('renvoie null tant que non signé', () => {
    expect(signedPdfPath(base)).toBeNull();
  });
});
