'use client'

import { motion } from 'framer-motion'
import { Download, FileText, FileImage, FileArchive, ClipboardList, FolderOpen } from 'lucide-react'
import { PortalCard } from './PortalCard'
import { formatDate } from '@/lib/utils'

export interface PortalDocument {
  id: string
  name: string
  category: 'mockup' | 'deliverable' | 'contract' | string
  file_url: string
  file_size: number | null
  mime_type: string | null
  created_at: string
}

interface DocsProps {
  documents: PortalDocument[]
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  mockup: { label: 'Maquettes', icon: FileImage, color: '#f59e0b' },
  deliverable: { label: 'Livrables', icon: FileArchive, color: '#10b981' },
  contract: { label: 'Contrats', icon: ClipboardList, color: '#3b82f6' },
}

const CATEGORY_ORDER = ['mockup', 'deliverable', 'contract']

function humanSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return ''
  const units = ['o', 'Ko', 'Mo', 'Go']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

function fileIcon(mime: string | null) {
  if (!mime) return FileText
  if (mime.startsWith('image/')) return FileImage
  if (mime.includes('zip') || mime.includes('archive') || mime.includes('compressed')) return FileArchive
  return FileText
}

// Filtre les protocoles dangereux (javascript:, data:, vbscript:...)
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function PortalDocuments({ documents }: DocsProps) {
  if (documents.length === 0) return null

  const grouped = CATEGORY_ORDER
    .map(cat => ({ cat, items: documents.filter(d => d.category === cat) }))
    .filter(g => g.items.length > 0)

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <PortalCard style={{ padding: '24px 28px' }}>
          <h2
            style={{
              color: '#1a1a2e',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FolderOpen size={14} style={{ color: '#7c3aed' }} />
            Documents partagés
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {grouped.map(({ cat, items }) => {
              const config = CATEGORY_CONFIG[cat]
              const CategoryIcon = config.icon

              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <CategoryIcon size={14} style={{ color: config.color }} />
                    <h3 style={{ color: '#1a1a2e', fontSize: 14, fontWeight: 600 }}>{config.label}</h3>
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(107,114,128,0.08)',
                        padding: '1px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {items.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(doc => {
                      const FileIcon = fileIcon(doc.mime_type)
                      const size = humanSize(doc.file_size)
                      const safeUrl = isSafeUrl(doc.file_url) ? doc.file_url : undefined

                      return (
                        <a
                          key={doc.id}
                          href={safeUrl ?? '#'}
                          aria-disabled={!safeUrl}
                          onClick={e => { if (!safeUrl) e.preventDefault() }}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: 'rgba(124,58,237,0.04)',
                            border: '1px solid rgba(124,58,237,0.08)',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                          }}
                          className="hover:bg-violet-100/60 hover:border-violet-300"
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: 'rgba(124,58,237,0.10)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FileIcon size={16} style={{ color: '#7c3aed' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                color: '#1a1a2e',
                                fontSize: 13,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {doc.name}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
                              {formatDate(doc.created_at)}
                              {size && <> · {size}</>}
                            </p>
                          </div>
                          <Download size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </PortalCard>
      </motion.div>
    </section>
  )
}
