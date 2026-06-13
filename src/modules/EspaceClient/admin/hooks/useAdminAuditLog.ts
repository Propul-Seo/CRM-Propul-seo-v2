import { useCallback, useEffect, useState } from 'react';
import { adminRpc, type AuditLogRow } from '../lib/adminRpc';

const PAGE = 100;

interface UseAdminAuditLogResult {
  rows: AuditLogRow[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  resourceType: string | null;
  setResourceType: (t: string | null) => void;
  loadMore: () => Promise<void>;
}

export function useAdminAuditLog(projectId: string): UseAdminAuditLogResult {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [resourceType, setResourceType] = useState<string | null>(null);

  const fetchPage = useCallback(async (offset: number, type: string | null) => {
    setLoading(true);
    const { data, error: err } = await adminRpc('admin_get_audit_log', {
      p_project_id: projectId, p_limit: PAGE, p_offset: offset, p_resource_type: type,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setError(null);
    const page = (Array.isArray(data) ? data : []) as AuditLogRow[];
    setHasMore(page.length === PAGE);
    setRows(prev => offset === 0 ? page : [...prev, ...page]);
    setLoading(false);
  }, [projectId]);

  // Recharge depuis 0 au montage et à chaque changement de filtre/projet.
  useEffect(() => { void fetchPage(0, resourceType); }, [fetchPage, resourceType]);

  const loadMore = useCallback(async () => {
    if (loading) return; // garde anti double-clic (évite des lignes en double)
    await fetchPage(rows.length, resourceType);
  }, [fetchPage, rows.length, resourceType, loading]);

  return { rows, loading, error, hasMore, resourceType, setResourceType, loadMore };
}
