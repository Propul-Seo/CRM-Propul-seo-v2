import { useMemo, useState } from 'react';
import { Loader2, FolderPlus, Download, Eye, EyeOff, Pencil, Trash2, FolderOpen, FileSearch } from 'lucide-react';
import {
  DocumentTypeIcon, docMeta, DOC_CHIP_TONE, FilePreviewDialog,
} from '@/modules/EspaceClient/shared/components';
import { AdminEmptyState } from '@/modules/EspaceClient/admin/components/kit';
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

const actionBtn = 'rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40';

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
    <div className="space-y-5 py-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pièces du projet</p>
          <h2 className="text-lg font-semibold text-foreground">
            {documents.length} document{documents.length > 1 ? 's' : ''}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow-sm transition-colors hover:bg-primary/85"
        >
          <FolderPlus className="h-4 w-4" /> Ajouter un document
        </button>
      </header>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {actionError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{actionError}</p>}

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : documents.length === 0 ? (
        <AdminEmptyState
          icon={FolderOpen}
          title="Aucun document"
          body="Téléversez le premier document du projet."
          action={
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-primary/85"
            >
              <FolderPlus className="h-4 w-4" /> Ajouter un document
            </button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => {
              const active = filter === f.value;
              const count = countFor(documents, f.types);
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
                    (active ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground')}
                >
                  {f.label}
                  <span className={'rounded-full px-1.5 text-xs tabular-nums ' + (active ? 'bg-primary/20 text-primary' : 'bg-surface-3 text-foreground/70')}>{count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun document pour ce filtre.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map(doc => {
                const meta = docMeta(doc.document_type, doc.file_mime_type);
                const busy = busyId === doc.id;
                return (
                  <li
                    key={doc.id}
                    className="group rounded-xl border border-border bg-surface-2 p-4 shadow-glow-sm transition-colors hover:border-border-subtle hover:bg-surface-3 sm:p-5"
                  >
                    <div className="flex items-start gap-4">
                      <DocumentTypeIcon type={doc.document_type} mime={doc.file_mime_type} className="h-12 w-12" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-foreground">{doc.name}</h3>
                          {doc.version > 1 && (
                            <span className="shrink-0 rounded-md bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-foreground/70">v{doc.version}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className={'rounded-md px-2 py-0.5 text-[11px] font-semibold ' + DOC_CHIP_TONE[meta.tone]}>{meta.label}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-xs tabular-nums text-muted-foreground">{formatSize(doc.file_size_bytes)}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          {doc.visible_to_client ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Visible client
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Masqué
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button type="button" title="Aperçu" aria-label="Aperçu" onClick={() => setPreview(doc)} className={actionBtn}><FileSearch className="h-4 w-4" /></button>
                        <button type="button" title="Télécharger" aria-label="Télécharger" onClick={() => void downloadDocument(doc)} className={actionBtn}><Download className="h-4 w-4" /></button>
                        <button type="button" title={doc.visible_to_client ? 'Masquer au client' : 'Rendre visible'} aria-label="Visibilité" disabled={busy} onClick={() => onToggle(doc)} className={actionBtn}>
                          {doc.visible_to_client ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button type="button" title="Modifier" aria-label="Modifier" onClick={() => setEditing(doc)} className={actionBtn}><Pencil className="h-4 w-4" /></button>
                        <button type="button" title="Supprimer" aria-label="Supprimer" disabled={busy} onClick={() => onDelete(doc)} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
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
