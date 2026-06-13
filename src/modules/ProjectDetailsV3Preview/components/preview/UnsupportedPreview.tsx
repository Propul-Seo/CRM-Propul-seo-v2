import { Download, FileQuestion } from 'lucide-react'

interface Props {
  signedUrl: string
  fileName: string
  reason?: string
}

export function UnsupportedPreview({ signedUrl, fileName, reason }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0a0814] p-8 text-center">
      <FileQuestion className="h-12 w-12 text-[#A78BFA]/60" />
      <p className="text-sm text-[#ede9fe]">
        {reason ?? 'Aperçu non disponible pour ce type de fichier'}
      </p>
      <a
        href={signedUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-[rgba(139,92,246,0.18)] bg-[#A78BFA]/10 px-4 py-2 text-sm text-[#ede9fe] hover:bg-[#A78BFA]/20 transition-colors"
      >
        <Download className="h-4 w-4" />
        Télécharger {fileName}
      </a>
    </div>
  )
}
