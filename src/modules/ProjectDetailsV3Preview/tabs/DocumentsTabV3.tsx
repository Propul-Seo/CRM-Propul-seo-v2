import { useState, useEffect, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { v2, supabase } from '@/lib/supabase'
import { useIsProjectV3Admin } from '../hooks/useIsProjectV3Admin'
import { DocumentPreviewModal } from '../components/DocumentPreviewModal'
import { useDocumentPreviewV3 } from '../hooks/useDocumentPreviewV3'
import { DocumentDropzone } from './documents/DocumentDropzone'
import { DocumentFilters, type FilterValue } from './documents/DocumentFilters'
import { DocumentList } from './documents/DocumentList'
import { DocumentToolbar, type SortKey } from './documents/DocumentToolbar'
import {
  CATEGORIES, CATEGORY_ORDER, inferCategory, BUCKET, type Doc,
} from './documents/constants'
import type { ProjectV2, DocumentCategory } from '@/types/project-v2'

interface Props {
  project: ProjectV2
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
    // Lecture depuis la vue unifiée (CRM + portail). Chaque ligne expose son
    // bucket et son source pour permettre download/delete différenciés.
    const { data, error } = await supabase
      .from('project_documents_unified_v2')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[DocumentsTabV3] fetchDocs failed', { projectId, error })
      toast.error(`Impossible de charger les documents : ${error.message}`)
    }
    setDocs((data as Doc[]) ?? [])
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

    const { error: insertError } = await v2.from('project_documents').insert({
      project_id: projectId,
      name: file.name,
      category: inferCategory(file.name, file.type),
      version,
      file_path: path,
      file_size: file.size,
      mime_type: file.type || null,
      uploader_name: 'Admin',
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
    if (doc.source === 'portal') {
      toast.info('Ce document a été fourni via le portail client. Supprimez-le depuis l\'onglet Documents du portail ou désactivez le portail.')
      setConfirmDeleteId(null)
      return
    }
    try {
      if (doc.file_path && doc.bucket !== 'external') {
        const { error: storageError } = await supabase.storage.from(doc.bucket).remove([doc.file_path])
        if (storageError) {
          console.error('[DocumentsTabV3] storage.remove failed', { path: doc.file_path, bucket: doc.bucket, error: storageError })
          throw new Error(`Suppression du fichier impossible : ${storageError.message}`)
        }
      }
      const { error: dbError } = await v2.from('project_documents').delete().eq('id', doc.id)
      if (dbError) {
        console.error('[DocumentsTabV3] db.delete failed', { id: doc.id, error: dbError })
        throw new Error(`Suppression de la fiche impossible : ${dbError.message}`)
      }
      setDocs((prev) => prev.filter((d) => d.id !== doc.id))
      setConfirmDeleteId(null)
      toast.success('Document supprimé')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de supprimer le document')
    }
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
          confirmDeleteId={confirmDeleteId}
          onPreview={openPreview}
          onDownload={handleDownload}
          onAskDelete={setConfirmDeleteId}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onDelete={handleDelete}
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
