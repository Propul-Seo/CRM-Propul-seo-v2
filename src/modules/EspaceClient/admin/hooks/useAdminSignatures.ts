import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

export interface CreateSignatureInput {
  name: string;
  signatureType: string;          // 'quote' | 'contract' | 'addendum' | 'other'
  signerEmail: string;
  signerName?: string;
  templateId: string;
}

interface UseAdminSignaturesResult {
  signatures: PortalSignature[];
  loading: boolean;
  error: string | null;
  createEnabled: boolean;
  refresh: () => Promise<void>;
  createSignature: (input: CreateSignatureInput) => Promise<{ error: string | null }>;
  remindSignature: (sig: PortalSignature, clientEmail: string | null) => Promise<{ error: string | null }>;
  cancelSignature: (sig: PortalSignature) => Promise<{ error: string | null }>;
}

export function useAdminSignatures(projectId: string): UseAdminSignaturesResult {
  const [signatures, setSignatures] = useState<PortalSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createEnabled, setCreateEnabled] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from('propulspace_signatures')
      .select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (err) { setError(err.message); setSignatures([]); }
    else { setError(null); setSignatures((data ?? []) as unknown as PortalSignature[]); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Probe DocuSeal au montage → grise le bouton de création si non configuré.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await supabase.functions
        .invoke('admin-docuseal-create-submission', { body: { probe: true } })
        .catch(() => ({ data: null }));
      const configured = Boolean((res.data as { configured?: boolean } | null)?.configured);
      if (!cancelled) setCreateEnabled(configured);
    })();
    return () => { cancelled = true; };
  }, []);

  const createSignature = useCallback<UseAdminSignaturesResult['createSignature']>(async (input) => {
    const { data, error: err } = await supabase.functions.invoke('admin-docuseal-create-submission', {
      body: {
        project_id: projectId,
        template_id: input.templateId,
        name: input.name,
        signature_type: input.signatureType,
        signer_email: input.signerEmail,
        signer_name: input.signerName,
      },
    });
    if (err) return { error: err.message ?? 'Échec de la création' };
    const res = data as { ok?: boolean; reason?: string } | null;
    if (res && res.ok === false) {
      return { error: res.reason === 'not_configured' ? "DocuSeal n'est pas encore configuré." : 'Création impossible.' };
    }
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  const remindSignature = useCallback<UseAdminSignaturesResult['remindSignature']>(async (sig, clientEmail) => {
    if (!clientEmail) return { error: "Pas d'email client" };
    if (!sig.docuseal_signing_url) return { error: 'Lien de signature indisponible' };
    const today = new Date().toISOString().slice(0, 10);
    const { error: err } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'signature-requested',
        to: { email: clientEmail },
        params: { doc_title: sig.name, doc_type: sig.signature_type, sign_url: sig.docuseal_signing_url },
        dedupe_key: `${sig.id}-reminder-${today}`,
      },
    });
    return { error: err ? (err.message ?? 'Échec') : null };
  }, []);

  const cancelSignature = useCallback<UseAdminSignaturesResult['cancelSignature']>(async (sig) => {
    const { error: err } = await adminRpc('admin_cancel_signature', { p_signature_id: sig.id });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  return { signatures, loading, error, createEnabled, refresh, createSignature, remindSignature, cancelSignature };
}
