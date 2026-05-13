import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  signedUrl: string
  fileName: string
}

export function ImagePreview({ signedUrl, fileName }: Props) {
  const [zoomed, setZoomed] = useState(false)

  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center bg-[#0a0814] p-4">
      <img
        src={signedUrl}
        alt={fileName}
        onClick={() => setZoomed((z) => !z)}
        className={cn(
          'transition-transform duration-200 select-none',
          zoomed
            ? 'cursor-zoom-out max-w-none max-h-none'
            : 'cursor-zoom-in max-w-full max-h-full object-contain',
        )}
        draggable={false}
      />
    </div>
  )
}
