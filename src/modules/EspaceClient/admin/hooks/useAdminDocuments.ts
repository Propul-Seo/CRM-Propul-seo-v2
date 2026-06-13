import { useCallback, useEffect, useState } from 'react';
import { v2, supabase } from '@/lib/supabase';
import { adminRpc } from '../lib/adminRpc';
import { getAdminSignedUrl } from '../lib/adminStorage';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

const BUCKET = 'propulspace-documents';

export interface UploadDocumentInput {
  file: File;
  documentType: string;
  name: string;
  description?: string | null;
  category?: string | null;
  visibleToClient: boolean;
}

export interface UpdateDocumentPatch {
  name?: string;
  category?: string | null;
  description?: string | null;
  visibleToClient?: boolean;
}

interface UseAdminDocumentsResult {
  documents: PortalDocument[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  uploadDocument: (input: UploadDocumentInput) => Promise<{ error: string | null }>;
  updateDocument: (id: string, patch: UpdateDocumentPatch) => Promise<{ error: string | null }>;
  deleteDocument: (id: string) => Promise<{ error: string | null }>;
  downloadDocument: (doc: PortalDocument) => Promise<void>;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function useAdminDocuments(projectId: string): UseAdminDocumentsResult {
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await v2.from('propulspace_documents_admin')
      .select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (err) { setError(err.message); setDocuments([]); }
    else { setError(null); setDocuments((data ?? []) as unknown as PortalDocument[]); }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const uploadDocument = useCallback<UseAdminDocumentsResult['uploadDocument']>(async (input) => {
    const path = `${projectId}/documents/${crypto.randomUUID()}-${safeName(input.file.name)}`;
    const up = await supabase.storage.from(BUCKET).upload(path, input.file, {
      contentType: input.file.type || undefined, upsert: false,
    });
    if (up.error) return { error: up.error.message };
    const { error: err } = await adminRpc('admin_create_document', {
      p_project_id: projectId,
      p_document_type: input.documentType,
      p_name: input.name,
      p_file_url: path,
      p_file_size_bytes: input.file.size,
      p_file_mime_type: input.file.type || null,
      p_category: input.category ?? null,
      p_description: input.description ?? null,
      p_visible_to_client: input.visibleToClient,
    });
    if (err) {
      // rollback du fichier orphelin si l'insert RPC échoue
      await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
      return { error: err.message };
    }
    await refresh();
    return { error: null };
  }, [projectId, refresh]);

  const updateDocument = useCallback<UseAdminDocumentsResult['updateDocument']>(async (id, patch) => {
    const { error: err } = await adminRpc('admin_update_document', {
      p_document_id: id,
      p_name: patch.name ?? null,
      p_category: patch.category ?? null,
      p_description: patch.description ?? null,
      p_visible_to_client: patch.visibleToClient ?? null,
    });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const deleteDocument = useCallback<UseAdminDocumentsResult['deleteDocument']>(async (id) => {
    const { error: err } = await adminRpc('admin_delete_document', { p_document_id: id });
    if (err) return { error: err.message };
    await refresh();
    return { error: null };
  }, [refresh]);

  const downloadDocument = useCallback<UseAdminDocumentsResult['downloadDocument']>(async (doc) => {
    const url = await getAdminSignedUrl(BUCKET, doc.file_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return { documents, loading, error, refresh, uploadDocument, updateDocument, deleteDocument, downloadDocument };
}
