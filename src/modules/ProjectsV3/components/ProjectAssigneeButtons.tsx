import { Check, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProjectAssigneeButtonUser {
  id: string
  name: string
  email?: string | null
}

interface Props {
  users: ProjectAssigneeButtonUser[]
  value: string
  onChange: (id: string) => void
  size?: 'sm' | 'md'
  layout?: 'segmented' | 'cards'
  allowToggleOff?: boolean
  className?: string
}

export function ProjectAssigneeButtons({
  users,
  value,
  onChange,
  size = 'md',
  layout = 'cards',
  allowToggleOff = false,
  className,
}: Props) {
  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[rgba(139,92,246,0.22)] bg-[#0f0b1e] px-3 py-2 text-xs text-[#6b7280]">
        Responsables indisponibles
      </div>
    )
  }

  return (
    <div
      className={cn(
        layout === 'segmented'
          ? 'inline-flex items-center gap-1 rounded-md border border-[rgba(139,92,246,0.2)] bg-[#070512] p-1'
          : 'grid grid-cols-2 gap-2',
        className,
      )}
    >
      {users.map((user, index) => {
        const active = value === user.id
        const initials = user.name.slice(0, 1).toUpperCase()
        const accent = index % 2 === 0 ? '#8B5CF6' : '#10b981'
        return (
          <button
            key={user.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(allowToggleOff && active ? '' : user.id)}
            className={cn(
              'group relative overflow-hidden border font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40',
              size === 'sm'
                ? 'h-8 rounded px-2 text-[11px]'
                : 'h-11 rounded-md px-3 text-xs',
              layout === 'segmented' ? 'min-w-[82px]' : 'w-full',
              active
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/18 text-[#ede9fe] shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_8px_20px_rgba(0,0,0,0.18)]'
                : 'border-[rgba(139,92,246,0.18)] bg-[#0f0b1e] text-[#9ca3af] hover:border-[rgba(139,92,246,0.45)] hover:bg-[#171030] hover:text-[#ede9fe]',
            )}
          >
            <span
              className={cn(
                'absolute inset-x-0 top-0 h-px opacity-0 transition-opacity',
                active && 'opacity-100',
              )}
              style={{ background: accent }}
            />
            <span className="relative flex items-center justify-center gap-2">
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors',
                  size === 'sm' ? 'h-5 w-5' : 'h-6 w-6',
                  active
                    ? 'border-white/20 text-white'
                    : 'border-[rgba(139,92,246,0.18)] text-[#9ca3af] group-hover:text-[#ede9fe]',
                )}
                style={{ background: active ? accent : 'rgba(139,92,246,0.08)' }}
              >
                {active ? <Check className="h-3 w-3" /> : initials || <UserRound className="h-3 w-3" />}
              </span>
              <span className="truncate">{user.name}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
