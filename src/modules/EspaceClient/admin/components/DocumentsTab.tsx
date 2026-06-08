import { useMemo, useState } from 'react';
import { Plus, Download, Eye, EyeOff, Pencil, Trash2, FolderOpen, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIcon, FilePreviewDialog } from '@/modules/EspaceClient/shared/components';
import { AdminTabScaffold } from './AdminTabScaffold';
import { AdminDocumentUpload } from './AdminDocumentUpload';
import { AdminDocumentEditDialog } from './AdminDocumentEditDialog';
import { useAdminDocuments } from '../hooks/useAdminDocuments';
import { getAdminSignedUrl } from '../lib/adminStorage';
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData';

const BUCKET = 'propulspace-documents';

const FILTERS: Array<{ label: string; types: string[] | null }> = [
  { label: 'Tous', types: null },
  { label: 'Contrats', types: ['quote', 'contract', 'legal'] },
  { label: 'Factures', types: ['invoice'] },
  { label: 'Livrables', types: ['deliverable', 'audit', 'report'] },
  { label: 'Assets', types: ['asset_logo', 'asset_charter', 'asset_content', 'asset_access'] },
];

const formatSize = (b: number | null) =>
  b == null ? '' : b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1048576).toFixed(1)} Mo`;

export function DocumentsTab({ projectId }: { projectId: string }) {
  const { documents, loading, error, uploadDocument, updateDocument, deleteDocument, downloadDocument } = useAdminDocuments(projectId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<PortalDocument | null>(null);
  const [preview, setPreview] = useState<PortalDocument | null>(null);
  const [filter, setFilter] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const types = FILTERS[filter].types;
    return types ? documents.filter(d => types.includes(d.document_type)) : documents;
  }, [documents, filter]);

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
    <>
      <AdminTabScaffold
        title={`${documents.length} document${documents.length > 1 ? 's' : ''}`}
        action={{ label: 'Ajouter un document', icon: Plus, onClick: () => setUploadOpen(true) }}
        loading={loading} error={error} actionError={actionError}
        isEmpty={documents.length === 0} emptyIcon={FolderOpen} emptyTitle="Aucun document" emptyBody="Téléversez le premier document du projet."
      >
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {FILTERS.map((f, i) => (
              <button key={f.label} type="button" onClick={() => setFilter(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${filter === i ? 'bg-primary text-white' : 'bg-surface-2 text-foreground/80'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-border">
            {filtered.map(doc => (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <FileIcon mime={doc.file_mime_type ?? undefined} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(doc.file_size_bytes)}{doc.version > 1 ? ` · v${doc.version}` : ''}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${doc.visible_to_client ? 'bg-emerald-500/10 text-emerald-300' : 'bg-surface-2 text-muted-foreground'}`}>
                  {doc.visible_to_client ? 'Visible client' : 'Masqué'}
                </span>
                <Button variant="ghost" size="icon" title="Aperçu" onClick={() => setPreview(doc)}><FileSearch className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Télécharger" onClick={() => void downloadDocument(doc)}><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title={doc.visible_to_client ? 'Masquer au client' : 'Rendre visible'} disabled={busyId === doc.id} onClick={() => onToggle(doc)}>
                  {doc.visible_to_client ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" title="Modifier" onClick={() => setEditing(doc)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Supprimer" disabled={busyId === doc.id} onClick={() => onDelete(doc)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        </div>
      </AdminTabScaffold>
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
    </>
  );
}
