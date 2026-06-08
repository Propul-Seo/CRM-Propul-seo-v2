import { useMemo, useState } from 'react';
import { Loader2, Plus, Download, Eye, EyeOff, Pencil, Trash2, FolderOpen, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIcon, FilePreviewDialog } from '@/modules/EspaceClient/shared/components';
import { AdminSectionHeader, AdminCard, AdminEmptyState, AdminFilterPills } from '@/modules/EspaceClient/admin/components/kit';
import { AdminDocumentUpload } from './AdminDocumentUpload';
import { AdminDocumentEditDialog } from './AdminDocumentEditDialog';
import { useAdminDocuments } from '../hooks/useAdminDocuments';
import { getAdminSignedUrl } from '../lib/adminStorage';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

const BUCKET = 'propulspace-documents';

type FilterValue = 'all' | 'contracts' | 'invoices' | 'deliverables' | 'assets';

const FILTERS: Array<{ label: string; value: FilterValue; types: string[] | null }> = [
  { label: 'Tous', value: 'all', types: null },
  { label: 'Contrats', value: 'contracts', types: ['quote', 'contract', 'legal'] },
  { label: 'Factures', value: 'invoices', types: ['invoice'] },
  { label: 'Livrables', value: 'deliverables', types: ['deliverable', 'audit', 'report'] },
  { label: 'Assets', value: 'assets', types: ['asset_logo', 'asset_charter', 'asset_content', 'asset_access'] },
];

const formatSize = (b: number | null) =>
  b == null ? '' : b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`;

const countFor = (docs: PortalDocument[], types: string[] | null) =>
  types ? docs.filter(d => types.includes(d.document_type)).length : docs.length;

export function DocumentsTab({ projectId }: { projectId: string }) {
  const { documents, loading, error, uploadDocument, updateDocument, deleteDocument, downloadDocument } = useAdminDocuments(projectId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<PortalDocument | null>(null);
  const [preview, setPreview] = useState<PortalDocument | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const types = FILTERS.find(f => f.value === filter)?.types ?? null;
    return types ? documents.filter(d => types.includes(d.document_type)) : documents;
  }, [documents, filter]);

  const pills = useMemo(
    () => FILTERS.map(f => ({ label: f.label, value: f.value, count: countFor(documents, f.types) })),
    [documents],
  );

  async function onToggle(doc: PortalDocument) {
    setBusyId(doc.id); setActionError(null);
    const { error } = await updateDocument(doc.id, { visibleToClient: !doc.visible_to_client });
    if (error) setActionError(error);
    setBusyId(null);
  }
  async function onDelete(doc: PortalDocument) {
    if (!window.confirm(`Supprimer le document « ${doc.name} » ?`)) return;
    setBusyId(doc.id); setActionError(null);
    const { error } = await deleteDocument(doc.id);
    if (error) setActionError(error);
    setBusyId(null);
  }

  return (
    <div className="space-y-4 py-2">
      <AdminSectionHeader
        title={`${documents.length} document${documents.length > 1 ? 's' : ''}`}
        action={{ label: 'Ajouter un document', icon: Plus, onClick: () => setUploadOpen(true) }}
      />

      {loading && (
        <div className="py-6 text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…</div>
      )}
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {actionError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

      {!loading && !error && documents.length === 0 && (
        <AdminEmptyState
          icon={FolderOpen}
          title="Aucun document"
          body="Téléversez le premier document du projet."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter un document
            </Button>
          }
        />
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="space-y-3">
          <AdminFilterPills filters={pills} current={filter} onChange={setFilter} />

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun document pour ce filtre.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map(doc => (
                <li key={doc.id}>
                  <AdminCard className="flex items-center gap-4">
                    <FileIcon mime={doc.file_mime_type ?? undefined} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(doc.file_size_bytes)}{doc.version > 1 ? ` · v${doc.version}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        doc.visible_to_client
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-surface-3 text-muted-foreground'
                      }`}
                    >
                      {doc.visible_to_client ? 'Visible client' : 'Masqué'}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon" title="Aperçu" onClick={() => setPreview(doc)}><FileSearch className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Télécharger" onClick={() => void downloadDocument(doc)}><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title={doc.visible_to_client ? 'Masquer au client' : 'Rendre visible'} disabled={busyId === doc.id} onClick={() => onToggle(doc)}>
                        {doc.visible_to_client ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" title="Modifier" onClick={() => setEditing(doc)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Supprimer" disabled={busyId === doc.id} onClick={() => onDelete(doc)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </AdminCard>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <FilePreviewDialog
        open={preview !== null}
        onOpenChange={(o) => { if (!o) setPreview(null); }}
        name={preview?.name ?? ''}
        mime={preview?.file_mime_type ?? null}
        resolveUrl={() => preview ? getAdminSignedUrl(BUCKET, preview.file_url) : Promise.resolve(null)}
      />
      <AdminDocumentUpload open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={uploadDocument} />
      <AdminDocumentEditDialog
        open={editing !== null}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        doc={editing}
        onSubmit={(patch) => editing ? updateDocument(editing.id, patch) : Promise.resolve({ error: null })}
      />
    </div>
  );
}
