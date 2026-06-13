import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ProcedureCategory } from '../types'

interface CategoryChipsProps {
  categories: ProcedureCategory[]
  selected: string | null
  onSelect: (id: string | null) => void
  isAdmin: boolean
  onCreate: (input: { name: string; color?: string }) => Promise<ProcedureCategory | null>
  onDelete?: (id: string) => Promise<boolean>
}

const PALETTE = ['#8b5cf6', '#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#64748b']

export function CategoryChips({
  categories,
  selected,
  onSelect,
  isAdmin,
  onCreate,
  onDelete,
}: CategoryChipsProps) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const result = await onCreate({ name: trimmed, color })
    if (result) {
      toast.success('Catégorie créée')
      setName('')
      setCreating(false)
    } else {
      toast.error('Erreur lors de la création')
    }
  }

  const handleDelete = async (cat: ProcedureCategory) => {
    if (!onDelete) return
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?\nLes fiches associées ne seront pas supprimées mais perdront leur catégorie.`)) return
    const ok = await onDelete(cat.id)
    if (ok) toast.success('Catégorie supprimée')
    else toast.error('Erreur lors de la suppression')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'text-xs px-3 py-1 rounded-full border transition-colors',
          selected === null
            ? 'bg-primary/15 border-primary/40 text-primary'
            : 'bg-surface-2 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
        )}
      >
        Toutes
      </button>

      {categories.map((cat) => (
        <div key={cat.id} className="group relative">
          <button
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-colors',
              selected === cat.id
                ? 'border-primary/50 text-foreground'
                : 'bg-surface-2 border-border text-muted-foreground hover:text-foreground'
            )}
            style={
              selected === cat.id
                ? { backgroundColor: `${cat.color ?? '#8b5cf6'}22`, borderColor: cat.color ?? undefined }
                : undefined
            }
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
              style={{ backgroundColor: cat.color ?? '#8b5cf6' }}
            />
            {cat.name}
          </button>
          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => handleDelete(cat)}
              className="absolute -top-1 -right-1 p-0.5 bg-surface-3 border border-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Supprimer la catégorie"
            >
              <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}

      {isAdmin && !creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="text-xs px-3 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors inline-flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Catégorie
        </button>
      )}

      {isAdmin && creating && (
        <div className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-full px-2 py-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') {
                setCreating(false)
                setName('')
              }
            }}
            autoFocus
            placeholder="Nom"
            className="bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground w-24"
          />
          <div className="flex gap-0.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-3 h-3 rounded-full border border-border/60',
                  color === c && 'ring-2 ring-offset-1 ring-offset-surface-2 ring-primary'
                )}
                style={{ backgroundColor: c }}
                aria-label={`Couleur ${c}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false)
              setName('')
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
