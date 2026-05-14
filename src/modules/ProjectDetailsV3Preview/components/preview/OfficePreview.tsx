import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

interface Props {
  signedUrl: string
  fileName: string
}

export function OfficePreview({ signedUrl, fileName }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`

  useEffect(() => {
    if (loaded) return
    const timer = setTimeout(() => {
      if (!loaded) setFailed(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [loaded])

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0a0814] p-8 text-center">
        <p className="text-sm text-[#ede9fe]">
          Aperçu Office indisponible — télécharger pour ouvrir
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

  return (
    <iframe
      src={viewerUrl}
      title={fileName}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className="w-full h-full border-0 bg-[#0a0814]"
    />
  )
}
