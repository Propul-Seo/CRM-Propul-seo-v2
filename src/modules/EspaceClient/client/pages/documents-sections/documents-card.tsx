import { Download, FileText, Loader2, Search, X } from 'lucide-react'
import { Badge, EmptyState, FileIcon, Skeleton } from '@/modules/EspaceClient/shared/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { FILTER_CATEGORIES, TYPE_LABELS, extOf, formatSize } from './documents-lib'

// Carte dense des documents — même forme que la carte jalons du projet
// (header px-5 py-3.5, lignes divide-y px-5 py-3). Téléchargement et aperçu
// inchangés.

interface DocumentsCardProps {
  loading: boolean
  error: string | null
  totalCount: number
  filtered: PortalDocument[]
  filter: string
  onFilterChange: (key: string) => void
  search: string
  onSearchChange: (value: string) => void
  downloadingId: string | null
  onDownload: (doc: PortalDocument) => void
  onPreview: (doc: PortalDocument) => void
}

export function DocumentsCard({
  loading, error, totalCount, filtered, filter, onFilterChange,
  search, onSearchChange, downloadingId, onDownload, onPreview,
}: DocumentsCardProps) {
  const compteur = loading
    ? '…'
    : filtered.length !== totalCount
      ? `${filtered.length} sur ${totalCount}`
      : `${totalCount} document${totalCount > 1 ? 's' : ''}`

  return (
    <section className="ps-surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--ps-border-soft)] px-5 py-3.5">
        <h2 className="ps-h3 text-[var(--ps-fg)]">Documents partagés</h2>
        <Badge tone="gray" dot={false}>{compteur}</Badge>
      </header>

      <div className="flex flex-col gap-2 border-b border-[var(--ps-border-soft)] px-5 py-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ps-fg-muted)]" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom…"
            className="pl-8 pr-8"
          />
          {search && (
            <button
              type="button"
              aria-label="Effacer"
              onClick={() => onSearchChange('')}
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[var(--ps-fg-muted)] transition-colors hover:text-[var(--ps-fg)]"
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
                onClick={() => onFilterChange(cat.key)}
                aria-pressed={active}
                className={`ps-tap min-h-[36px] rounded-full px-3 text-[12px] font-medium transition-colors duration-200 ${
                  active
                    ? 'bg-[var(--ps-primary-subtle)] text-[var(--ps-primary-text)] ring-1 ring-[var(--ps-primary-subtle)]'
                    : 'text-[var(--ps-fg-secondary)] hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {[0, 1, 2, 3].map(i => (
            <li key={i} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
                <Skeleton className="mt-2 h-3 w-1/3 rounded-md" />
              </div>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="m-4 rounded-[var(--ps-radius-input)] border border-[var(--ps-danger-subtle)] bg-[var(--ps-danger-subtle)] px-3.5 py-2.5 text-[13px] text-[var(--ps-danger-text)]">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="p-5">
          <EmptyState
            icon={FileText}
            title={totalCount === 0 ? "Aucun document pour l'instant" : 'Aucun résultat'}
            body={totalCount === 0
              ? "Les devis, contrats et livrables apparaîtront ici dès qu'ils seront ajoutés."
              : 'Essayez un autre filtre ou modifiez votre recherche.'}
          />
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="divide-y divide-[var(--ps-border-soft)]">
          {filtered.map(doc => (
            <li
              key={doc.id}
              onClick={() => onPreview(doc)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(doc) } }}
              className="flex min-h-[48px] cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--ps-bg-subtle)]"
            >
              <FileIcon ext={extOf(doc.name)} mime={doc.file_mime_type ?? undefined} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium leading-5 text-[var(--ps-fg)]">{doc.name}</p>
                <p className="ps-num text-[12px] text-[var(--ps-fg-secondary)]">
                  {TYPE_LABELS[doc.document_type] ?? doc.document_type}
                  {doc.file_size_bytes ? ` · ${formatSize(doc.file_size_bytes)}` : ''}
                  {` · v${doc.version}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onDownload(doc) }}
                disabled={downloadingId === doc.id}
                className="ps-tap border-[var(--ps-border-strong)] text-[12px] font-semibold text-[var(--ps-fg-secondary)] transition-colors duration-200 hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)]"
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
  )
}
