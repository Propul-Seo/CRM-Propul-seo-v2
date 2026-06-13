import { useState } from 'react'
import { FileText, Mail, Phone, CheckSquare, Calendar, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityType } from '../types'
import { ActivityModal } from './modals/ActivityModal'

interface Props {
  onAdd: (type: ActivityType, content: string) => Promise<void>
}

const ACTIONS: { type: ActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'note',    label: 'Note',    icon: FileText,    color: 'hover:text-violet-400 hover:bg-violet-500/10' },
  { type: 'email',  label: 'E-mail',  icon: Mail,        color: 'hover:text-green-400 hover:bg-green-500/10' },
  { type: 'call',   label: 'Appel',   icon: Phone,       color: 'hover:text-blue-400 hover:bg-blue-500/10' },
  { type: 'task',   label: 'Tâche',   icon: CheckSquare, color: 'hover:text-amber-400 hover:bg-amber-500/10' },
  { type: 'meeting',label: 'Réunion', icon: Calendar,    color: 'hover:text-pink-400 hover:bg-pink-500/10' },
]

export function QuickActionBar({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<ActivityType>('note')

  const handleClick = (type: ActivityType) => {
    setDefaultType(type)
    setOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-1 px-5 py-2.5 border-b border-[rgba(139,92,246,0.18)] bg-[#070512] shrink-0">
        {ACTIONS.map(({ type, label, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => handleClick(type)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[#9ca3af]',
              'transition-all text-[10px] font-medium',
              color
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
        <button className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[#0f0b1e] transition-all text-[10px] font-medium ml-1">
          <MoreHorizontal className="h-4 w-4" />
          Plus
        </button>
      </div>

      <ActivityModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async (type, content) => { await onAdd(type, content); setOpen(false) }}
        activity={null}
        defaultType={defaultType}
      />
    </>
  )
}
