import { NavLink } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

const VARIANTS = [
  { path: '/dashboard-preview-1', label: 'Cockpit', tag: '01' },
  { path: '/dashboard-preview-2', label: 'Hero',    tag: '02' },
  { path: '/dashboard-preview-3', label: 'Bento',   tag: '03' },
  { path: '/dashboard-preview-4', label: 'Éditorial', tag: '04' },
] as const

export function PreviewSwitcher() {
  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-[rgba(2,2,5,0.85)] border-b border-[rgba(139,92,246,0.18)]">
      <div className="flex items-center gap-3 px-5 py-2.5">
        <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-[#9ca3af]">
          Dashboard previews
        </span>
        <div className="flex gap-1 ml-auto">
          {VARIANTS.map((v) => (
            <NavLink
              key={v.path}
              to={v.path}
              className={({ isActive }) =>
                `text-[11px] px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                    : 'text-[#9ca3af] border-[rgba(139,92,246,0.25)] hover:text-[#ede9fe] hover:border-[#8B5CF6]'
                }`
              }
            >
              <span className="font-mono text-[9px] opacity-60">{v.tag}</span>
              {v.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
