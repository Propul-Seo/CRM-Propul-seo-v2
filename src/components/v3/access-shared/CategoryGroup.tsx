import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react'

interface Props {
  label: string
  icon: LucideIcon
  count: number
  defaultExpanded?: boolean
  children: ReactNode
}

export function CategoryGroup({ label, icon: Icon, count, defaultExpanded = true, children }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 w-full text-left hover:bg-[rgba(139,92,246,0.08)] rounded px-1 py-0.5 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-[#9ca3af]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#9ca3af]" />}
        <Icon className="h-4 w-4 text-[#A78BFA]" />
        <span className="text-sm font-medium text-[#ede9fe]">{label}</span>
        <span className="text-xs text-[#9ca3af]">{count}</span>
      </button>
      {expanded && (
        <div className="space-y-2 pl-1">
          {children}
        </div>
      )}
    </div>
  )
}
