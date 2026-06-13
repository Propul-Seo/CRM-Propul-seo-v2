import { useRef, useEffect } from 'react'

interface Props {
  signedUrl: string
  fileName: string
}

export function VideoPreview({ signedUrl, fileName }: Props) {
  const ref = useRef<HTMLVideoElement>(null)

  const handleLoadedMetadata = () => {
    const el = ref.current
    if (!el) return
    void el.play().catch(() => {
      // Autoplay can be blocked by the browser; ignore silently.
    })
  }

  // Cleanup : pause + reset à l'unmount pour libérer le canal audio/video
  // (sinon Safari/Firefox peuvent laisser la lecture active après fermeture du modal).
  useEffect(() => {
    return () => {
      const el = ref.current
      if (!el) return
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0814] p-4">
      <video
        ref={ref}
        src={signedUrl}
        title={fileName}
        controls
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        className="max-w-full max-h-full"
      >
        <track kind="captions" />
      </video>
    </div>
  )
}
