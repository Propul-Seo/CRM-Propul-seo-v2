import { useEffect, useRef, useState } from 'react'
import { Building2, Mail, Phone, MoreHorizontal, Pencil, Trash2, Crown, Wrench, Receipt, User as UserIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PROJECT_CONTACT_ROLE_LABELS,
  type ProjectContactRole,
  type ProjectContactWithDetails,
} from '@/types/project-v2'
import { MenuItemV3 } from './MenuItemV3'

interface Props {
  link: ProjectContactWithDetails
  onEdit: () => void
  onChangeRole: (role: ProjectContactRole) => void
  onUnlink: () => void
}

const ROLE_STYLES: Record<ProjectContactRole, { badge: string; icon: React.ElementType }> = {
  primary:        { badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30', icon: Crown },
  decision_maker: { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',   icon: ChevronRight },
  technical:      { badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',      icon: Wrench },
  billing:        { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: Receipt },
  other:          { badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',   icon: UserIcon },
}

const ROLE_OPTIONS: ProjectContactRole[] = ['primary', 'decision_maker', 'technical', 'billing', 'other']

export function ContactCardV3({ link, onEdit, onChangeRole, onUnlink }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [roleSubmenuOpen, setRoleSubmenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu au clic en dehors
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setRoleSubmenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const { contact, role } = link
  const roleStyle = ROLE_STYLES[role]
  const RoleIcon = roleStyle.icon
  const isPrimary = role === 'primary'

  return (
    <div className="relative bg-[#0f0b1e] border border-[rgba(139,92,246,0.15)] rounded-lg p-3 space-y-2">
      {/* Header : avatar + nom + rôle + menu */}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
            isPrimary
              ? 'bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.3)]'
              : 'bg-[#171030] border border-[rgba(139,92,246,0.15)]',
          )}
        >
          {isPrimary ? (
            <Building2 className="h-3.5 w-3.5 text-[#A78BFA]" />
          ) : (
            <UserIcon className="h-3.5 w-3.5 text-[#9ca3af]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#ede9fe] truncate">{contact.name}</p>
          {contact.company && (
            <p className="text-[10px] text-[#9ca3af] truncate">{contact.company}</p>
          )}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="h-6 w-6 rounded flex items-center justify-center text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 w-44 bg-[#070512] border border-[rgba(139,92,246,0.25)] rounded-md shadow-lg overflow-hidden">
              <MenuItemV3
                icon={Pencil}
                label="Modifier"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit()
                }}
              />
              <div className="relative">
                <MenuItemV3
                  icon={RoleIcon}
                  label="Changer rôle"
                  trailing={<ChevronRight className="h-3 w-3" />}
                  onClick={() => setRoleSubmenuOpen((o) => !o)}
                />
                {roleSubmenuOpen && (
                  <div className="absolute right-full top-0 mr-1 w-40 bg-[#070512] border border-[rgba(139,92,246,0.25)] rounded-md shadow-lg overflow-hidden">
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setRoleSubmenuOpen(false)
                          if (r !== role) onChangeRole(r)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors',
                          r === role
                            ? 'bg-[rgba(139,92,246,0.15)] text-[#A78BFA]'
                            : 'text-[#ede9fe] hover:bg-[rgba(139,92,246,0.1)]',
                        )}
                      >
                        {PROJECT_CONTACT_ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-[rgba(139,92,246,0.15)]" />
              <MenuItemV3
                icon={Trash2}
                label="Délier du projet"
                destructive
                onClick={() => {
                  setMenuOpen(false)
                  onUnlink()
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Badge rôle */}
      <div className="flex">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border',
            roleStyle.badge,
          )}
        >
          <RoleIcon className="h-2.5 w-2.5" />
          {PROJECT_CONTACT_ROLE_LABELS[role]}
        </span>
      </div>

      {/* Coordonnées : email + téléphone */}
      {(contact.email || contact.phone) && (
        <div className="space-y-1 pt-1">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-[10px] text-[#9ca3af] hover:text-[#ede9fe] transition-colors group"
            >
              <Mail className="h-3 w-3 shrink-0 group-hover:text-[#A78BFA]" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-[10px] text-[#9ca3af] hover:text-[#ede9fe] transition-colors group"
            >
              <Phone className="h-3 w-3 shrink-0 group-hover:text-[#A78BFA]" />
              <span className="truncate">{contact.phone}</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

