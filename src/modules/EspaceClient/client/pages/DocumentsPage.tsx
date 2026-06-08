import { useMemo, useState } from 'react'
import { FileText, Download, Loader2, Search, X } from 'lucide-react'
import { Hero, EmptyState, FileIcon, SectionHead } from '@/modules/EspaceClient/shared/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePortalDocuments, getSignedStorageUrl, type PortalDocument } from '../hooks/usePortalData'
import { inferBucket } from '@/modules/ProjectDetailsV3Preview/tabs/documents/constants'

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function downloadDocument(doc: PortalDocument) {
  const bucket = inferBucket(doc.file_url)
  // Doc à lien externe (ex. charte fournie via une URL WeTransfer/Drive/Notion) :
  // pas de fichier Storage à signer, on ouvre directement le lien.
  if (bucket === 'external') {
    window.open(doc.file_url, '_blank', 'noopener,noreferrer')
    return
  }
  const url = await getSignedStorageUrl(bucket, doc.file_url)
  if (!url) {
    alert('Impossible de générer le lien de téléchargement. Réessayez plus tard.')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

const TYPE_LABELS: Record<string, string> = {
  quote: 'Devis', contract: 'Contrat', invoice: 'Facture',
  deliverable: 'Livrable', audit: 'Audit', report: 'Rapport',
  asset_logo: 'Logo', asset_charter: 'Charte', asset_content: 'Contenu',
  asset_access: 'Accès', legal: 'Légal', other: 'Autre',
}

const FILTER_CATEGORIES: Array<{ key: string; label: string; types: string[] }> = [
  { key: 'all',         label: 'Tous',       types: [] },
  { key: 'contracts',   label: 'Contrats',   types: ['quote', 'contract', 'legal'] },
  { key: 'invoices',    label: 'Factures',   types: ['invoice'] },
  { key: 'deliverables', label: 'Livrables', types: ['deliverable', 'audit', 'report'] },
  { key: 'assets',      label: 'Assets',     types: ['asset_logo', 'asset_charter', 'asset_content', 'asset_access'] },
]

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function DocumentsPage() {
  const { rows, loading, error } = usePortalDocuments()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
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
    await downloadDocument(doc)
    setDownloadingId(null)
  }

  return (
    <div className="ps-fade-in space-y-6">
      <Hero
        eyebrow="Documents"
        title="Vos documents"
        subtitle="Tous vos livrables et documents en un seul endroit."
      />

      <section className="ps-surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--ps-border-soft)] px-6 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom…"
              className="pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                aria-label="Effacer"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ps-fg-muted)] hover:text-[var(--ps-fg)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_CATEGORIES.map(cat => {
              const active = filter === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setFilter(cat.key)}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                    active
                      ? 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)] ring-1 ring-[var(--ps-primary-subtle)]'
                      : 'text-[var(--ps-fg-muted)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
        <SectionHead title={`${filtered.length} document${filtered.length > 1 ? 's' : ''}${filtered.length !== rows.length ? ` sur ${rows.length}` : ''}`} />
        {loading && (
          <div className="flex items-center justify-center py-8 text-[var(--ps-fg-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && (
          <p className="m-4 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title={rows.length === 0 ? "Aucun document pour l'instant" : 'Aucun résultat'}
              body={rows.length === 0
                ? "Les devis, contrats et livrables apparaîtront ici dès qu'ils seront ajoutés."
                : 'Essayez un autre filtre ou modifiez votre recherche.'}
            />
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-[var(--ps-border-soft)]">
            {filtered.map(doc => (
              <li key={doc.id} className="flex items-center gap-4 px-6 py-3.5">
                <FileIcon ext={extOf(doc.name)} mime={doc.file_mime_type ?? undefined} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-[var(--ps-fg)]">{doc.name}</p>
                  <p className="text-[12px] text-[var(--ps-fg-muted)]">
                    {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                    {doc.file_size_bytes ? ` · ${formatSize(doc.file_size_bytes)}` : ''}
                    {` · v${doc.version}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Télécharger
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
