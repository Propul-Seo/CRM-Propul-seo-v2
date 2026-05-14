import { useState } from 'react'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { STATUS_CONFIG, PRIORITY_CLASS, PRIORITY_LABEL } from './constants'
import type { ChecklistItemV2, ChecklistStatus } from '@/types/project-v2'

interface Props {
  item: ChecklistItemV2
  subItems: ChecklistItemV2[]
  pendingIds?: Set<string>
  onCycleStatus: (id: string, current: ChecklistStatus) => void
  onAddSubTask: (parentId: string, title: string) => void
  onDelete: (id: string) => void
  canDelete?: boolean
}

export function ProductionItem({ item, subItems, pendingIds, onCycleStatus, onAddSubTask, onDelete, canDelete = true }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [subOpen, setSubOpen] = useState(false)
  const [subTitle, setSubTitle] = useState('')

  const statusConf = STATUS_CONFIG[item.status]
  const StatusIcon = statusConf.icon
  const isPending = pendingIds?.has(item.id) ?? false

  const submitSub = () => {
    if (!subTitle.trim()) return
    onAddSubTask(item.id, subTitle.trim())
    setSubTitle('')
    setSubOpen(false)
  }

  return (
    <div>
      <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-3/30 transition-colors group">
        <button
          onClick={() => onCycleStatus(item.id, item.status)}
          disabled={isPending}
          className={cn(
            'mt-0.5 shrink-0 transition-colors',
            isPending ? 'opacity-70 cursor-wait' : 'hover:scale-110',
            statusConf.color,
          )}
          title={isPending ? 'Enregistrement…' : `Statut : ${statusConf.label}`}
          aria-busy={isPending}
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <StatusIcon className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm leading-tight',
            item.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground',
          )}>
            {item.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {item.assigned_name && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                  {item.assigned_name.charAt(0)}
                </span>
                {item.assigned_name}
              </span>
            )}
            {item.due_date && <span className="text-[10px] text-muted-foreground">{item.due_date}</span>}
            {subItems.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {subItems.filter((s) => s.status === 'done').length}/{subItems.length} sous-tâches
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setSubOpen(!subOpen); setSubTitle('') }}
            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
            title="Ajouter une sous-tâche"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {canDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-muted-foreground hover:text-red-400 transition-colors p-0.5"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {item.priority !== 'medium' && (
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border shrink-0', PRIORITY_CLASS[item.priority])}>
            {PRIORITY_LABEL[item.priority] ?? item.priority}
          </Badge>
        )}
      </div>

      {confirmDelete && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-300">Supprimer cette tâche ?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onDelete(item.id); setConfirmDelete(false) }}
              className="px-2.5 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
            >
              Supprimer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 border border-border rounded text-xs text-muted-foreground hover:bg-surface-3 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {subItems.map((sub) => {
        const conf = STATUS_CONFIG[sub.status]
        const Icon = conf.icon
        const subPending = pendingIds?.has(sub.id) ?? false
        return (
          <div key={sub.id} className="flex items-start gap-3 pl-8 pr-4 py-2 bg-surface-3/20 border-t border-border/30 hover:bg-surface-3/40 transition-colors group">
            <button
              onClick={() => onCycleStatus(sub.id, sub.status)}
              disabled={subPending}
              className={cn(
                'mt-0.5 shrink-0 transition-colors',
                subPending ? 'opacity-70 cursor-wait' : 'hover:scale-110',
                conf.color,
              )}
              title={subPending ? 'Enregistrement…' : `Statut : ${conf.label}`}
              aria-busy={subPending}
            >
              {subPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Icon className="h-3.5 w-3.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs leading-tight',
                sub.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground/80',
              )}>
                {sub.title}
              </p>
            </div>
            <button
              onClick={() => onDelete(sub.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-0.5 shrink-0"
              title="Supprimer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )
      })}

      {subOpen && (
        <div className="flex items-center gap-2 pl-8 pr-4 py-2 bg-surface-3/30 border-t border-border/30">
          <input
            type="text"
            value={subTitle}
            onChange={(e) => setSubTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); submitSub() }
              if (e.key === 'Escape') { setSubOpen(false); setSubTitle('') }
            }}
            placeholder="Titre de la sous-tâche..."
            className="flex-1 bg-surface-3 border border-border rounded-md px-2 py-1 text-xs text-foreground placeholder-muted-foreground"
            autoFocus
          />
          <button onClick={submitSub} className="px-2.5 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors shrink-0">
            Ajouter
          </button>
          <button
            onClick={() => { setSubOpen(false); setSubTitle('') }}
            className="px-2 py-1 border border-border rounded text-xs text-muted-foreground hover:bg-surface-3 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
