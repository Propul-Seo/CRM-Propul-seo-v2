import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSignedStorageUrl, type PortalDocument } from '@/modules/EspaceClient/client/hooks/usePortalData'
import { inferBucket } from '@/modules/ProjectDetailsV3Preview/tabs/documents/constants'

// Libellés, filtres et téléchargement de la page Documents (logique inchangée).

export const TYPE_LABELS: Record<string, string> = {
  quote: 'Devis', contract: 'Contrat', invoice: 'Facture',
  deliverable: 'Livrable', audit: 'Audit', report: 'Rapport',
  asset_logo: 'Logo', asset_charter: 'Charte', asset_content: 'Contenu',
  asset_access: 'Accès', legal: 'Légal', other: 'Autre',
}

export const FILTER_CATEGORIES: Array<{ key: string; label: string; types: string[] }> = [
  { key: 'all',         label: 'Tous',       types: [] },
  { key: 'contracts',   label: 'Contrats',   types: ['quote', 'contract', 'legal'] },
  { key: 'invoices',    label: 'Factures',   types: ['invoice'] },
  { key: 'deliverables', label: 'Livrables', types: ['deliverable', 'audit', 'report'] },
  { key: 'assets',      label: 'Assets',     types: ['asset_logo', 'asset_charter', 'asset_content', 'asset_access'] },
]

export function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export async function downloadDocument(storage: SupabaseClient<Database>, doc: PortalDocument) {
  const bucket = inferBucket(doc.file_url)
  // Doc à lien externe (ex. charte fournie via une URL WeTransfer/Drive/Notion) :
  // pas de fichier Storage à signer, on ouvre directement le lien.
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
