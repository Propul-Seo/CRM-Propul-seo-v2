import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

export function DocumentDropzone({ onFile, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-2xl py-10 px-8 text-center cursor-pointer
        transition-all duration-200 select-none
        ${isDragging
          ? 'border-[#8B5CF6] bg-[rgba(139,92,246,0.15)] scale-[1.01]'
          : 'border-[rgba(139,92,246,0.3)] bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)] hover:border-[#8B5CF6]/60'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
        <Upload className="h-6 w-6 text-[#A78BFA]" />
      </div>
      <h3 className="text-base font-semibold text-[#ede9fe] mb-1">
        {isDragging ? 'Déposez le fichier ici' : 'Glissez vos fichiers ici'}
      </h3>
      <p className="text-xs text-[#9ca3af] mb-3">
        PDF · DOCX · PNG · JPG · MP4 — jusqu'à 50 Mo par fichier
      </p>
      <span className="inline-block px-4 py-1.5 text-xs font-medium text-[#A78BFA] bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)] rounded-md">
        Parcourir…
      </span>
    </div>
  )
}
