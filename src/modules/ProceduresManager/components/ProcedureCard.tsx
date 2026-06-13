import { Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Procedure, ProcedureCategory } from '../types'

interface ProcedureCardProps {
  procedure: Procedure
  category: ProcedureCategory | null
  onClick: () => void
}

export function ProcedureCard({ procedure, category, onClick }: ProcedureCardProps) {
  const updated = new Date(procedure.updated_at)
  const relative = formatRelative(updated)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left w-full bg-surface-1 hover:bg-surface-2 border border-border/60 hover:border-primary/30',
        'rounded-lg p-4 transition-colors group flex flex-col gap-2 h-full'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {category && (
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: category.color ?? '#8b5cf6' }}
              title={category.name}
            />
          )}
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {procedure.title}
          </h3>
        </div>
        {procedure.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
      </div>

      {procedure.summary && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{procedure.summary}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex flex-wrap gap-1 min-w-0">
          {procedure.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
          {procedure.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{procedure.tags.length - 3}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{relative}</span>
      </div>
    </button>
  )
}

function formatRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return "aujourd'hui"
  if (days < 2) return 'hier'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`
  if (days < 365) return `il y a ${Math.floor(days / 30)}mois`
  return d.toLocaleDateString('fr-FR')
}
