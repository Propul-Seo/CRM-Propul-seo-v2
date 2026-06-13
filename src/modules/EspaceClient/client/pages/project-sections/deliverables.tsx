import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Badge, FileIcon } from '@/modules/EspaceClient/shared/components'
import { usePortal } from '@/modules/EspaceClient/shared/context/PortalContext'
import { getSignedStorageUrl, type PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { inferBucket } from '@/modules/ProjectDetailsV3Preview/tabs/documents/constants'
import { formatShort } from './format'

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

// ── Livrable téléchargeable (logique conservée à l'identique) ─────
async function downloadDocument(storage: SupabaseClient<Database>, doc: PortalDocument): Promise<void> {
  const bucket = inferBucket(doc.file_url)
  if (bucket === 'external') {
    window.open(doc.file_url, '_blank', 'noopener,noreferrer')
    return
  }
  const url = await getSignedStorageUrl(storage, bucket, doc.file_url)
  if (!url) {
    alert('Impossible de générer le lien de téléchargement. Réessayez plus tard.')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Livrables du projet (documents deliverable / audit / report). */
export function DeliverablesSection({ deliverables }: { deliverables: PortalDocument[] }) {
  if (deliverables.length === 0) return null
  return (
    <div className="ps-surface overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--ps-border-soft)] px-6 py-4">
        <h3 className="ps-h3 text-[var(--ps-fg)]">Livrables du projet</h3>
        <Badge tone="gray" dot={false}><span className="ps-num">{deliverables.length}</span></Badge>
      </header>
      <ul className="divide-y divide-[var(--ps-border-soft)]">
        {deliverables.map(doc => (
          <DeliverableRow key={doc.id} doc={doc} />
        ))}
      </ul>
    </div>
  )
}

function DeliverableRow({ doc }: { doc: PortalDocument }) {
  const { storage } = usePortal()
  const [downloading, setDownloading] = useState(false)
  async function handle() {
    setDownloading(true)
    await downloadDocument(storage, doc)
    setDownloading(false)
  }
  return (
    <li className="flex items-center gap-4 px-6 py-3.5">
      <FileIcon ext={extOf(doc.name)} mime={doc.file_mime_type ?? undefined} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-[var(--ps-fg)]">{doc.name}</p>
        <p className="ps-num text-[12px] text-[var(--ps-fg-muted)]">
          {formatShort(doc.created_at) ?? '—'}
          {` · v${doc.version}`}
        </p>
      </div>
      <button
        type="button"
        onClick={handle}
        disabled={downloading}
        className="ps-tap inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg border border-[var(--ps-border-strong)] px-3.5 text-[12px] font-semibold text-[var(--ps-fg-secondary)] transition-colors duration-200 hover:bg-[var(--ps-bg-subtle)] hover:text-[var(--ps-fg)] disabled:opacity-50"
      >
        {downloading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" strokeWidth={2} />}
        Télécharger
      </button>
    </li>
  )
}
