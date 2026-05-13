import { FileText, Download, Trash2, X, Folder, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CATEGORIES, formatSize, type Doc } from './constants'
import type { DocumentCategory } from '@/types/project-v2'

interface Props {
  category: DocumentCategory
  docs: Doc[]
  isOpen: boolean
  confirmDeleteId: string | null
  onToggle: () => void
  onAskDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (doc: Doc) => void
  onDownload: (doc: Doc) => void
  onPreview?: (doc: Doc) => void
  canDelete?: boolean
}

export function DocumentFolder({
  category, docs, isOpen, confirmDeleteId,
  onToggle, onAskDelete, onCancelDelete, onDelete, onDownload, onPreview,
  canDelete = true,
}: Props) {
  const conf = CATEGORIES[category]
  const Icon = conf.icon

  return (
    <div className={cn('rounded-lg border overflow-hidden', conf.bg)}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        {isOpen
          ? <FolderOpen className={cn('h-4 w-4 shrink-0', conf.color)} />
          : <Folder className={cn('h-4 w-4 shrink-0', conf.color)} />
        }
        <Icon className={cn('h-3.5 w-3.5 shrink-0 opacity-60', conf.color)} />
        <span className={cn('text-sm font-medium flex-1 text-left', conf.color)}>{conf.label}</span>
        <span className="text-xs text-muted-foreground">{docs.length}</span>
        {isOpen
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
      </button>

      {isOpen && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {docs.map((doc) => (
            <div key={doc.id}>
              <div
                onClick={() => {
                  if (onPreview && doc.file_path) onPreview(doc)
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 bg-surface-1/50 hover:bg-surface-2/50 transition-colors',
                  onPreview && doc.file_path && 'cursor-pointer',
                )}
              >
                <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {doc.version && (
                      <span className="text-[10px] bg-surface-3 text-muted-foreground px-1.5 py-0.5 rounded">V{doc.version}</span>
                    )}
                    {doc.file_size != null && (
                      <span className="text-[10px] text-muted-foreground">{formatSize(doc.file_size)}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(doc.created_at), 'd MMM yyyy', { locale: fr })}
                    </span>
                    {doc.uploader_name && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{doc.uploader_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {doc.file_path ? (
                    <button
                      onClick={() => onDownload(doc)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => toast.info('Fichier non disponible')}
                      className="text-muted-foreground/40 p-1 cursor-not-allowed"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onAskDelete(doc.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {confirmDeleteId === doc.id && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-500/10 border-t border-red-500/20">
                  <p className="text-xs text-red-300">Supprimer ce document ?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDelete(doc)}
                      className="px-2.5 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={onCancelDelete}
                      className="px-2.5 py-1 border border-border rounded text-xs text-muted-foreground hover:bg-surface-3 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
