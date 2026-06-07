import {
  FileText, FileImage, FileSpreadsheet, Archive, Receipt, ClipboardList, Briefcase,
} from 'lucide-react'
import type { DocumentCategory } from '@/types/project-v2'

export const BUCKET = 'propulspace-documents'

export const CATEGORIES: Record<DocumentCategory, {
  label: string
  color: string
  bg: string
  icon: typeof FileText
}> = {
  contract:    { label: 'Contrats',  color: 'text-blue-300',    bg: 'bg-blue-500/10 border-blue-500/30',       icon: ClipboardList },
  invoice:     { label: 'Factures',  color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: Receipt },
  brief:       { label: 'Briefs',    color: 'text-purple-300',  bg: 'bg-purple-500/10 border-purple-500/30',   icon: FileText },
  report:      { label: 'Rapports',  color: 'text-teal-300',    bg: 'bg-teal-500/10 border-teal-500/30',       icon: FileSpreadsheet },
  mockup:      { label: 'Maquettes', color: 'text-orange-300',  bg: 'bg-orange-500/10 border-orange-500/30',   icon: FileImage },
  deliverable: { label: 'Livrables', color: 'text-green-300',   bg: 'bg-green-500/10 border-green-500/30',     icon: Archive },
  other:       { label: 'Autres',    color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/30',       icon: Briefcase },
}

export const CATEGORY_ORDER: DocumentCategory[] = [
  'contract', 'invoice', 'brief', 'report', 'mockup', 'deliverable', 'other',
]

export function inferCategory(filename: string, mimeType?: string | null, emailSubject?: string): DocumentCategory {
  const name = filename.toLowerCase()
  const subject = (emailSubject ?? '').toLowerCase()
  const mime = (mimeType ?? '').toLowerCase()

  if (/facture|invoice|devis|acompte|solde|payment|paiement/.test(name + subject)) return 'invoice'
  if (/contrat|contract|accord|agreement|cgv|cgvu|nda|mandat/.test(name + subject)) return 'contract'
  if (/brief|cahier.des.charges|cdc|spec|specification|onboarding/.test(name + subject)) return 'brief'
  if (/rapport|report|audit|analyse|analytics|bilan|review|mensuel|hebdo/.test(name + subject)) return 'report'
  if (/maquette|mockup|wireframe|prototype|design|figma|sketch|xd/.test(name) || mime.includes('figma')) return 'mockup'
  if (/livrable|deliverable|livraison|export|final|v\d+/.test(name + subject) || mime === 'application/zip') return 'deliverable'
  if (mime.includes('image')) return 'mockup'
  if (mime.includes('spreadsheet') || mime.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'report'
  if (mime.includes('pdf')) {
    if (/contrat|contract/.test(name + subject)) return 'contract'
    if (/facture|invoice|devis/.test(name + subject)) return 'invoice'
  }
  return 'other'
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

// Déduit le bucket Storage à partir du file_url, en répliquant le CASE de la
// vue 254 (l.70-74). Utilisé côté portail (DocumentsPage) pour signer la bonne
// URL : les docs qualif vivent dans propulspace-uploads, les liens externes ne
// sont pas dans Storage, le reste dans propulspace-documents.
export function inferBucket(
  file_url: string,
): 'propulspace-documents' | 'propulspace-uploads' | 'external' {
  if (file_url.startsWith('qualification/')) return 'propulspace-uploads'
  if (file_url.startsWith('http')) return 'external'
  return 'propulspace-documents'
}

export type DocSource = 'crm' | 'portal'
export type DocBucket = 'project-documents' | 'propulspace-documents' | 'propulspace-uploads' | 'external'

// Doc = forme normalisée consommée par toute l'UI (DocumentRow, aperçu, tri…).
// Depuis SP4, la source est la vue admin propulspace_documents_admin_v2 ; ses
// rows (file_url / file_size_bytes / version int…) sont mappées vers cette forme
// dans DocumentsTabV3.fetchDocs. `bucket` vient désormais de la vue (colonne 288).
export interface Doc {
  id: string
  project_id: string
  name: string
  category: DocumentCategory
  version: string | null
  file_path: string | null
  file_size: number | null
  mime_type: string | null
  uploader_name: string | null
  created_at: string
  source: DocSource
  bucket: DocBucket
  description: string | null
  document_type: string | null
  // SP4 : visibilité portail (toggle inline) + origine client (guard delete).
  visible_to_client: boolean
  uploaded_by_client: boolean
}
