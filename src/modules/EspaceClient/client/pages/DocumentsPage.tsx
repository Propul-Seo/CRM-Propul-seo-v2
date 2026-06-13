import { useMemo, useState } from 'react'
import { FilePreviewDialog } from '@/modules/EspaceClient/shared/components'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import { PORTAL_DIALOG_CLASS } from '@/modules/EspaceClient/shared/constants'
import { usePortalDocuments, getSignedStorageUrl, type PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { inferBucket } from '@/modules/ProjectDetailsV3Preview/tabs/documents/constants'
import { DocumentsHeader } from './documents-sections/documents-header'
import { DocumentsCard } from './documents-sections/documents-card'
import { FILTER_CATEGORIES, TYPE_LABELS, downloadDocument } from './documents-sections/documents-lib'

/**
 * Page Documents du portail — forme compacte calquée sur l'aperçu admin
 * (couleurs Aurora) : en-tête masthead + carte dense unique (recherche,
 * filtres, lignes scannables). Téléchargement et aperçu inchangés.
 */
export function DocumentsPage() {
  const { rows, loading, error } = usePortalDocuments()
  const { storage } = usePortal()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PortalDocument | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const cat = FILTER_CATEGORIES.find(c => c.key === filter)
    const byType = !cat || cat.types.length === 0 ? rows : rows.filter(d => cat.types.includes(d.document_type))
    const q = search.trim().toLowerCase()
    if (!q) return byType
    return byType.filter(d => d.name.toLowerCase().includes(q) || (TYPE_LABELS[d.document_type] ?? '').toLowerCase().includes(q))
  }, [rows, filter, search])

  async function handleDownload(doc: PortalDocument) {
    setDownloadingId(doc.id)
    await downloadDocument(storage, doc)
    setDownloadingId(null)
  }

  return (
    <div className="ps-fade-in space-y-4">
      <DocumentsHeader count={rows.length} loading={loading} />

      <DocumentsCard
        loading={loading}
        error={error}
        totalCount={rows.length}
        filtered={filtered}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        downloadingId={downloadingId}
        onDownload={handleDownload}
        onPreview={setPreview}
      />

      <FilePreviewDialog
        open={preview !== null}
        onOpenChange={(o) => { if (!o) setPreview(null) }}
        themeClassName={PORTAL_DIALOG_CLASS}
        name={preview?.name ?? ''}
        mime={preview?.file_mime_type ?? null}
        resolveUrl={async () => {
          if (!preview) return null
          const bucket = inferBucket(preview.file_url)
          if (bucket === 'external') return preview.file_url
          return getSignedStorageUrl(storage, bucket, preview.file_url)
        }}
      />
    </div>
  )
}
