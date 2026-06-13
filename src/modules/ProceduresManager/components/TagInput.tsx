import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

export function TagInput({ value, onChange, suggestions = [], placeholder = 'Ajouter un tag…' }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
    if (!tag) return
    if (value.includes(tag)) return
    onChange([...value, tag])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (draft.trim()) addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const filtered = draft
    ? suggestions.filter((s) => s.includes(draft.toLowerCase()) && !value.includes(s)).slice(0, 6)
    : []

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-md bg-surface-2 min-h-[42px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-full"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-foreground transition-colors"
              aria-label={`Retirer ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-surface-3 border border-border rounded-md shadow-md overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className={cn(
                'w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              )}
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
