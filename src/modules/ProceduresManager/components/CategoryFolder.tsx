import { FolderOpen, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Procedure, ProcedureCategory } from '../types'

interface CategoryFolderProps {
  category: ProcedureCategory | null
  procedures: Procedure[]
  onClick: () => void
}

/**
 * Carte "dossier" pour la vue d'accueil par catégorie.
 * Affiche le nom, la couleur, le nombre de fiches et un aperçu
 * des 3 fiches les plus récentes de la catégorie.
 */
export function CategoryFolder({ category, procedures, onClick }: CategoryFolderProps) {
  const count = procedures.length
  const preview = procedures.slice(0, 3)
  const pinnedCount = procedures.filter((p) => p.is_pinned).length

  const color = category?.color ?? '#8b5cf6'
  const name = category?.name ?? 'Sans catégorie'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left w-full h-full bg-surface-1 hover:bg-surface-2 border border-border/60',
        'hover:border-primary/40 rounded-xl p-5 transition-all duration-200 flex flex-col gap-3',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="p-2.5 rounded-lg transition-colors shrink-0"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <FolderOpen className="h-5 w-5" />
        </div>
        {pinnedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
            <Pin className="h-2.5 w-2.5" />
            {pinnedCount}
          </span>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {count === 0
            ? 'Aucune fiche'
            : `${count} fiche${count > 1 ? 's' : ''}`}
        </p>
      </div>

      {preview.length > 0 && (
        <ul className="space-y-1 mt-auto pt-2 border-t border-border/40">
          {preview.map((p) => (
            <li
              key={p.id}
              className="text-xs text-muted-foreground truncate flex items-center gap-1.5"
            >
              <span
                className="inline-block w-1 h-1 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate">{p.title}</span>
            </li>
          ))}
          {count > 3 && (
            <li className="text-[10px] text-muted-foreground/70 pl-2.5">
              + {count - 3} autre{count - 3 > 1 ? 's' : ''}
            </li>
          )}
        </ul>
      )}
    </button>
  )
}
