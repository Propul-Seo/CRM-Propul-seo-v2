import { useEffect } from 'react'
import { Download, ExternalLink, X } from 'lucide-react'
import { getPreviewKind, isTooLargeToPreview } from '../utils/documentMimeType'
import { PdfPreview } from './preview/PdfPreview'
import { ImagePreview } from './preview/ImagePreview'
import { VideoPreview } from './preview/VideoPreview'
import { OfficePreview } from './preview/OfficePreview'
import { UnsupportedPreview } from './preview/UnsupportedPreview'

export interface PreviewDocument {
  name: string
  mime_type: string | null
  file_path: string | null
  file_size: number | null
}

interface Props {
  open: boolean
  onClose: () => void
  document: PreviewDocument | null
  signedUrl: string | null
}

export function DocumentPreviewModal({ open, onClose, document: doc, signedUrl }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !doc) return null

  const kind = getPreviewKind(doc.mime_type, doc.name)
  const tooLarge = isTooLargeToPreview(doc.file_size)

  const renderBody = () => {
    if (!signedUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center text-sm text-[#ede9fe]/70">
          Génération du lien d'aperçu…
        </div>
      )
    }
    if (tooLarge) {
      return (
        <UnsupportedPreview
          signedUrl={signedUrl}
          fileName={doc.name}
          reason="Fichier trop volumineux pour l'aperçu, télécharger"
        />
      )
    }
    if (kind === 'pdf') return <PdfPreview signedUrl={signedUrl} fileName={doc.name} />
    if (kind === 'image') return <ImagePreview signedUrl={signedUrl} fileName={doc.name} />
    if (kind === 'video') return <VideoPreview signedUrl={signedUrl} fileName={doc.name} />
    if (kind === 'office') return <OfficePreview signedUrl={signedUrl} fileName={doc.name} />
    return <UnsupportedPreview signedUrl={signedUrl} fileName={doc.name} />
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu de ${doc.name}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col rounded-lg border border-[rgba(139,92,246,0.18)] bg-[#0a0814] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[rgba(139,92,246,0.18)] bg-[#0a0814]">
          <p className="flex-1 text-sm font-medium text-[#ede9fe] truncate">{doc.name}</p>
          {signedUrl && (
            <>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir dans un nouvel onglet"
                className="p-1.5 rounded text-[#ede9fe]/70 hover:text-[#ede9fe] hover:bg-[#A78BFA]/10 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={signedUrl}
                download={doc.name}
                title="Télécharger"
                className="p-1.5 rounded text-[#ede9fe]/70 hover:text-[#ede9fe] hover:bg-[#A78BFA]/10 transition-colors"
              >
                <Download className="h-4 w-4" />
              </a>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Fermer"
            className="p-1.5 rounded text-[#ede9fe]/70 hover:text-[#ede9fe] hover:bg-[#A78BFA]/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-[#0a0814]">{renderBody()}</div>
      </div>
    </div>
  )
}
