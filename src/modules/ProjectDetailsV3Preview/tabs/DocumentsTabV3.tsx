import { useState, useEffect, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, v2 } from '@/lib/supabase'
import { adminRpc } from '@/modules/EspaceClient/admin/lib/adminRpc'
import { useIsProjectV3Admin } from '../hooks/useIsProjectV3Admin'
import { DocumentPreviewModal } from '../components/DocumentPreviewModal'
import { useDocumentPreviewV3 } from '../hooks/useDocumentPreviewV3'
import { DocumentDropzone } from './documents/DocumentDropzone'
import { DocumentFilters, type FilterValue } from './documents/DocumentFilters'
import { DocumentList } from './documents/DocumentList'
import { DocumentToolbar, type SortKey } from './documents/DocumentToolbar'
import {
  CATEGORIES, CATEGORY_ORDER, inferCategory, BUCKET, type Doc, type DocBucket,
} from './documents/constants'
import type { ProjectV2, DocumentCategory } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

// Row brute de la vue admin propulspace_documents_admin_v2 (mig. 281 + 288).
// Mappée vers `Doc` (forme normalisée de l'UI) dans fetchDocs.
interface AdminDocRow {
  id: string
  project_id: string
  document_type: string | null
  category: string | null
  name: string
  description: string | null
  file_url: string | null
  file_size_bytes: number | null
  file_mime_type: string | null
  version: number | null
  visible_to_client: boolean
  uploaded_by_client: boolean
  viewed_by_client_at: string | null
  created_at: string
  bucket: string
}

// Mapping CRM category -> document_type propulspace (inverse du CASE de la vue 254).
// Sert à l'INSERT : la table canonique impose un document_type de l'enum portail.
const CATEGORY_TO_DOCUMENT_TYPE: Record<DocumentCategory, string> = {
  contract: 'contract',
  invoice: 'invoice',
  brief: 'other',
  report: 'report',
  mockup: 'asset_logo',
  deliverable: 'deliverable',
  other: 'other',
}

// Mapping document_type propulspace -> category CRM (réplique le CASE de la vue 254),
// utilisé en fallback quand la colonne `category` de la row n'est pas une catégorie CRM.
const DOCUMENT_TYPE_TO_CATEGORY: Record<string, DocumentCategory> = {
  quote: 'contract', contract: 'contract', legal: 'contract',
  invoice: 'invoice', audit: 'report', report: 'report',
  deliverable: 'deliverable',
  asset_logo: 'mockup', asset_charter: 'mockup', asset_content: 'mockup',
}

function resolveCategory(row: AdminDocRow): DocumentCategory {
  if (row.category && row.category in CATEGORIES) return row.category as DocumentCategory
  if (row.document_type && row.document_type in DOCUMENT_TYPE_TO_CATEGORY) {
    return DOCUMENT_TYPE_TO_CATEGORY[row.document_type]
  }
  return 'other'
}

// Normalise une row de la vue admin vers la forme `Doc` attendue par toute l'UI.
function mapAdminRowToDoc(row: AdminDocRow): Doc {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    category: resolveCategory(row),
    version: row.version != null ? String(row.version) : null,
    file_path: row.file_url,
    file_size: row.file_size_bytes,
    mime_type: row.file_mime_type,
    uploader_name: row.uploaded_by_client ? 'Client' : 'Admin',
    created_at: row.created_at,
    source: row.uploaded_by_client ? 'portal' : 'crm',
    bucket: row.bucket as DocBucket,
    description: row.description,
    document_type: row.document_type,
    visible_to_client: row.visible_to_client,
    uploaded_by_client: row.uploaded_by_client,
  }
}

export function DocumentsTabV3({ project }: Props) {
  const projectId = project.id
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { isAdmin } = useIsProjectV3Admin()
  const { previewDoc, previewUrl, openPreview, closePreview } = useDocumentPreviewV3()

  const fetchDocs = async () => {
    // SP4 : lecture depuis la table canonique via la vue admin (filtre soft-delete,
    // colonne `bucket` fournie par la mig. 288). On normalise chaque row vers `Doc`.
    const { data, error } = await v2
      .from('propulspace_documents_admin')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[DocumentsTabV3] fetchDocs failed', { projectId, error })
      toast.error(`Impossible de charger les documents : ${error.message}`)
    }
    const rows = (data as AdminDocRow[] | null) ?? []
    setDocs(rows.map(mapAdminRowToDoc))
    setLoading(false)
  }

  useEffect(() => { fetchDocs() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [projectId])

  // Compteurs par catégorie pour les pills (basés sur tous les docs, indépendants du filtre)
  const counts = useMemo<Record<FilterValue, number>>(() => {
    const c: Record<FilterValue, number> = { all: docs.length } as Record<FilterValue, number>
    for (const cat of CATEGORY_ORDER) c[cat] = 0
    for (const d of docs) {
      const cat = d.category in CATEGORIES ? d.category : 'other'
      c[cat as DocumentCategory] = (c[cat as DocumentCategory] ?? 0) + 1
    }
    return c
  }, [docs])

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim()
    return docs
      .filter((d) => filter === 'all' || d.category === filter)
      .filter((d) => !q || d.name.toLowerCase().includes(q) || (d.uploader_name ?? '').toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortKey === 'name') return a.name.localeCompare(b.name)
        if (sortKey === 'size') return (b.file_size ?? 0) - (a.file_size ?? 0)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [docs, search, sortKey, filter])

  const handleFile = async (file: File) => {
    const existingVersions = docs
      .filter((d) => d.name.toLowerCase() === file.name.toLowerCase())
      .map((d) => parseInt(d.version ?? '1'))
    const version = String(existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${projectId}/${Date.now()}_v${version}_${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      toast.error(`Erreur upload : ${uploadError.message}`)
      return
    }

    const category = inferCategory(file.name, file.type)
    // SP4 : écriture via RPC admin (table canonique). Docs CRM internes par défaut
    // (p_visible_to_client: false) — l'admin les rend visibles via le toggle de ligne.
    const { error: insertError } = await adminRpc('admin_create_document', {
      p_project_id: projectId,
      p_name: file.name,
      p_file_url: path,
      p_document_type: CATEGORY_TO_DOCUMENT_TYPE[category],
      p_category: category,
      p_file_size_bytes: file.size,
      p_file_mime_type: file.type || null,
      p_visible_to_client: false,
    })

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path])
      toast.error(`Erreur métadonnées : ${insertError.message}`)
    } else {
      toast.success(`"${file.name}" ajouté`)
      fetchDocs()
    }
  }

  const handleDelete = async (doc: Doc) => {
    if (doc.uploaded_by_client) {
      toast.info('Ce document a été fourni via le portail client. Supprimez-le depuis l\'onglet Documents du portail ou désactivez le portail.')
      setConfirmDeleteId(null)
      return
    }
    try {
      // Anti-orphelin : on retire le fichier du Storage avant le soft-delete en base.
      if (doc.file_path && doc.bucket !== 'external') {
        const { error: storageError } = await supabase.storage.from(doc.bucket).remove([doc.file_path])
        if (storageError) {
          console.error('[DocumentsTabV3] storage.remove failed', { path: doc.file_path, bucket: doc.bucket, error: storageError })
          throw new Error(`Suppression du fichier impossible : ${storageError.message}`)
        }
      }
      // SP4 : soft-delete via RPC admin (deleted_at = now()).
      const { error: dbError } = await adminRpc('admin_delete_document', { p_document_id: doc.id })
      if (dbError) {
        console.error('[DocumentsTabV3] admin_delete_document failed', { id: doc.id, error: dbError })
        throw new Error(`Suppression de la fiche impossible : ${dbError.message}`)
      }
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
      setConfirmDeleteId(null)
      toast.success('Document supprimé')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de supprimer le document')
    }
  }

  // SP4 — toggle de visibilité portail directement sur la ligne. p_name omis (null)
  // => l'RPC ne touche QUE visible_to_client (cf. mig. 281). Mise à jour optimiste
  // puis refresh ; rollback en cas d'échec.
  const handleToggleVisibility = async (doc: Doc, next: boolean) => {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, visible_to_client: next } : d)))
    const { error } = await adminRpc('admin_update_document', {
      p_document_id: doc.id,
      p_visible_to_client: next,
    })
    if (error) {
      console.error('[DocumentsTabV3] admin_update_document failed', { id: doc.id, error })
      toast.error(`Impossible de mettre à jour la visibilité : ${error.message}`)
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, visible_to_client: !next } : d)))
      return
    }
    toast.success(next ? 'Document visible côté portail' : 'Document masqué côté portail')
    fetchDocs()
  }

  const handleDownload = async (doc: Doc) => {
    if (!doc.file_path) { toast.info('Fichier non disponible'); return }
    // Lien externe (charte URL fournie au questionnaire) : pas de signed URL, ouverture directe.
    if (doc.bucket === 'external') {
      window.open(doc.file_path, '_blank', 'noopener,noreferrer')
      return
    }
    const { data, error } = await supabase.storage.from(doc.bucket).createSignedUrl(doc.file_path, 60)
    if (error || !data?.signedUrl) {
      toast.error('Erreur génération lien')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-[#9ca3af]">Chargement…</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <DocumentToolbar
        count={docs.length}
        search={search}
        sortKey={sortKey}
        onSearchChange={setSearch}
        onSortChange={setSortKey}
      />

      <DocumentFilters active={filter} counts={counts} onChange={setFilter} />

      <DocumentDropzone onFile={handleFile} />

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-[#9ca3af] gap-3">
          <FileText className="h-10 w-10 opacity-30" />
          <p className="text-sm">Aucun document pour ce projet.</p>
          <p className="text-xs opacity-60">Les PJ des emails apparaîtront ici après une sync Gmail.</p>
        </div>
      ) : (
        <DocumentList
          filter={filter}
          visible={visible}
          search={search}
          canDelete={isAdmin}
          isAdmin={isAdmin}
          project={{
            name: project.name,
            portal_client_email: project.portal_client_email ?? null,
            client_first_name: project.client_first_name,
          }}
          confirmDeleteId={confirmDeleteId}
          onPreview={openPreview}
          onDownload={handleDownload}
          onAskDelete={setConfirmDeleteId}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
        />
      )}

      <DocumentPreviewModal
        open={previewDoc !== null}
        onClose={closePreview}
        document={previewDoc}
        signedUrl={previewUrl}
      />
    </div>
  )
}
