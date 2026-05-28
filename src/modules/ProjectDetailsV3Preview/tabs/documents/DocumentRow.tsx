import { useState } from 'react'
import { Eye, Download, Trash2, MoreVertical } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CATEGORIES, formatSize, type Doc } from './constants'
import { DocumentNotifyButton } from '@/components/propulspace/DocumentNotifyButton'

interface ProjectMeta {
  name: string
  portal_client_email: string | null
  client_first_name?: string | null
}

interface Props {
  doc: Doc
  canDelete: boolean
  isAdmin: boolean
  project: ProjectMeta
  isConfirmingDelete: boolean
  onPreview: (doc: Doc) => void
  onDownload: (doc: Doc) => void
  onAskDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (doc: Doc) => void
}

export function DocumentRow({
  doc, canDelete, isAdmin, project, isConfirmingDelete,
  onPreview, onDownload, onAskDelete, onCancelDelete, onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const cat = CATEGORIES[doc.category] ?? CATEGORIES.other
  const Icon = cat.icon

  const dateLabel = formatDistanceToNow(parseISO(doc.created_at), { addSuffix: true, locale: fr })

  return (
    <div
      onClick={() => onPreview(doc)}
      className="flex items-center gap-3 px-3.5 py-3 bg-[#070512] border border-[rgba(139,92,246,0.18)] rounded-lg cursor-pointer transition-all hover:border-[rgba(139,92,246,0.3)] hover:bg-[#0d0a1f]"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${cat.bg}`}>
        <Icon className={`h-4 w-4 ${cat.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[#ede9fe] truncate">{doc.name}</div>
        <div className="text-xs text-[#6b7280] mt-0.5">
          {doc.file_size != null && <>{formatSize(doc.file_size)} · </>}
          {dateLabel}
          {doc.uploader_name && <> · par {doc.uploader_name}</>}
        </div>
      </div>

      <span className={`text-[11px] px-2 py-0.5 rounded-md border ${cat.bg} ${cat.color}`}>
        {cat.label}
      </span>

      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onDownload(doc)}
          title="Télécharger"
          className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#A78BFA] hover:bg-[rgba(139,92,246,0.15)]"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onPreview(doc)}
          title="Aperçu"
          className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#A78BFA] hover:bg-[rgba(139,92,246,0.15)]"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        {isAdmin && doc.category === 'deliverable' && (
          <DocumentNotifyButton
            document={{
              id: doc.id,
              name: doc.name,
              document_type: doc.document_type,
              file_path: doc.file_path,
              bucket: doc.bucket,
              project,
            }}
          />
        )}
        {canDelete && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              title="Plus"
              className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#A78BFA] hover:bg-[rgba(139,92,246,0.15)]"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuOpen && !isConfirmingDelete && (
              <div className="absolute right-0 top-full mt-1 bg-[#070512] border border-[rgba(139,92,246,0.3)] rounded-lg shadow-lg z-10 min-w-[140px] py-1">
                <button
                  onClick={() => { setMenuOpen(false); onAskDelete(doc.id) }}
                  className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" /> Supprimer
                </button>
              </div>
            )}
            {isConfirmingDelete && (
              <div className="absolute right-0 top-full mt-1 bg-[#070512] border border-red-500/30 rounded-lg shadow-lg z-10 p-2 min-w-[180px]">
                <p className="text-xs text-[#ede9fe] mb-2">Supprimer ce document ?</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => onDelete(doc)}
                    className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Oui
                  </button>
                  <button
                    onClick={onCancelDelete}
                    className="flex-1 px-2 py-1 bg-[rgba(139,92,246,0.15)] text-[#ede9fe] text-xs rounded hover:bg-[rgba(139,92,246,0.25)]"
                  >
                    Non
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
