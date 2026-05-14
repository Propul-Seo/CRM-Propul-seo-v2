import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActionDef } from './types'
import { ActivityModal } from './ActivityModal'

interface Props<T extends string> {
  actions: ActionDef<T>[]
  onAdd: (type: T, content: string) => Promise<void>
  /** Affiche un bouton 'Plus' à droite (purement décoratif aujourd'hui) */
  showMore?: boolean
}

export function QuickActionBar<T extends string>({ actions, onAdd, showMore = true }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<T>(actions[0]?.type)

  const handleClick = (type: T) => {
    setDefaultType(type)
    setOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[rgba(139,92,246,0.18)] bg-[#070512] shrink-0">
        {actions.map(({ type, label, icon: Icon, colorClass, iconColorClass, description }) => (
          <button
            key={type}
            onClick={() => handleClick(type)}
            title={description ?? label}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3.5 h-12 rounded-lg text-[#ede9fe]',
              'transition-all text-[11px] font-medium',
              colorClass,
            )}
          >
            <Icon className={cn('h-4 w-4', iconColorClass ?? 'text-[#A78BFA]')} />
            {label}
          </button>
        ))}
        {showMore && (
          <button
            title="Plus d'actions"
            className="flex flex-col items-center justify-center gap-1 px-3.5 h-12 rounded-lg text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[#0f0b1e] transition-all text-[11px] font-medium ml-1"
          >
            <MoreHorizontal className="h-4 w-4" />
            Plus
          </button>
        )}
      </div>

      <ActivityModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async (type, content) => { await onAdd(type, content) }}
        actions={actions}
        defaultType={defaultType}
      />
    </>
  )
}
