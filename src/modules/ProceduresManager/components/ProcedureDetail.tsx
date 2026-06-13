import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Edit2, History, Pin, PinOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useIsProceduresAdmin } from '../hooks/useIsProceduresAdmin'
import { useProcedureCategories } from '../hooks/useProcedureCategories'
import { useProcedures } from '../hooks/useProcedures'
import { useProcedureAuthor } from '../hooks/useProcedureAuthor'
import { ProcedureViewDoc } from './views/ProcedureViewDoc'
import type { Procedure } from '../types'

interface ProcedureDetailProps {
  procedure: Procedure
  onBack: () => void
  onEdit: () => void
  onOpenRevisions: () => void
  onRefresh: (id: string) => Promise<Procedure | null>
}

export function ProcedureDetail({
  procedure,
  onBack,
  onEdit,
  onOpenRevisions,
  onRefresh,
}: ProcedureDetailProps) {
  const { isAdmin } = useIsProceduresAdmin()
  const { categories } = useProcedureCategories()
  const { togglePin, archive } = useProcedures()

  const [current, setCurrent] = useState<Procedure>(procedure)

  useEffect(() => {
    setCurrent(procedure)
  }, [procedure])

  const category = useMemo(
    () => categories.find((c) => c.id === current.category_id) ?? null,
    [categories, current.category_id],
  )

  const author = useProcedureAuthor(current.updated_by ?? current.author_id)

  const handleTogglePin = async () => {
    const ok = await togglePin(current.id, !current.is_pinned)
    if (ok) {
      toast.success(current.is_pinned ? 'Détachée' : 'Épinglée')
      const fresh = await onRefresh(current.id)
      if (fresh) setCurrent(fresh)
    } else {
      toast.error('Erreur')
    }
  }

  const handleArchive = async () => {
    if (!confirm(`Archiver la fiche "${current.title}" ?`)) return
    const ok = await archive(current.id)
    if (ok) {
      toast.success('Fiche archivée')
      onBack()
    } else {
      toast.error('Erreur')
    }
  }

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
            <button onClick={onBack} className="hover:text-foreground transition-colors">
              Procédures
            </button>
            {category && (
              <>
                <span>›</span>
                <span>{category.name}</span>
              </>
            )}
            <span>›</span>
            <span className="text-foreground truncate max-w-[300px]">{current.title}</span>
          </nav>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleTogglePin}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              title={current.is_pinned ? 'Détacher' : 'Épingler'}
            >
              {current.is_pinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onOpenRevisions}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              title="Historique"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Éditer
            </button>
            <button
              onClick={handleArchive}
              className="p-2 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Archiver"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <ProcedureViewDoc
        procedure={current}
        category={category}
        authorName={author.name}
        authorAvatarUrl={author.avatarUrl}
      />
    </div>
  )
}
