import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import type { PortalSignature } from '@/modules/EspaceClient/client/hooks/usePortalData';

export interface CreateSignatureInput {
  name: string;
  signatureType: string;          // 'quote' | 'contract' | 'addendum' | 'other'
  signerEmail: string;
  signerName?: string;
  documentId: string;             // document du projet à faire signer
}

interface UseAdminSignaturesResult {
  signatures: PortalSignature[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSignature: (input: CreateSignatureInput) => Promise<{ error: string | null }>;
  remindSignature: (sig: PortalSignature, clientEmail: string | null) => Promise<{ error: string | null }>;
  cancelSignature: (sig: PortalSignature) => Promise<{ error: string | null }>;
}

// Lien vers l'espace client (le client signe in-portail après connexion).
const portalUrl = () => `${window.location.origin}/espace-client`;

export function useAdminSignatures(projectId: string): UseAdminSignaturesResult {
  const [signatures, setSignatures] = useState<PortalSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from('propulspace_signatures')
      .select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (err) { setError(err.message); setSignatures([]); }
    else { setError(null); setSignatures((data ?? []) as unknown as PortalSignature[]); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createSignature = useCallback<UseAdminSignaturesResult['createSignature']>(async (input) => {
    const { data, error: err } = await adminRpc('admin_create_signature', {
      p_project_id: projectId,
      p_document_id: input.documentId,
      p_signature_type: input.signatureType,
      p_name: input.name,
      p_signer_email: input.signerEmail,
    });
    if (err) return { error: err.message };
    // Email « document à signer » (best-effort, ne bloque pas la création).
    await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'signature-requested',
        to: { email: input.signerEmail, name: input.signerName },
        params: { doc_title: input.name, doc_type: input.signatureType, sign_url: portalUrl() },
        dedupe_key: `${data as string}-requested`,
      },
    }).catch(() => undefined);
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  const remindSignature = useCallback<UseAdminSignaturesResult['remindSignature']>(async (sig, clientEmail) => {
    if (!clientEmail) return { error: "Pas d'email client" };
    const today = new Date().toISOString().slice(0, 10);
    const { error: err } = await supabase.functions.invoke('send-portal-email', {
      body: {
        template_key: 'signature-requested',
        to: { email: clientEmail },
        params: { doc_title: sig.name, doc_type: sig.signature_type, sign_url: portalUrl() },
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

  return { signatures, loading, error, refresh, createSignature, remindSignature, cancelSignature };
}
