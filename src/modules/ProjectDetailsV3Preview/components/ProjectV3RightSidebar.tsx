import { useState } from 'react'
import { User, Plus, Building2, Pencil, Mail, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectV2 } from '@/types/project-v2'
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_LABELS,
  getStatusStyle,
} from '../statusConfig'
import { ContactEditModalV3 } from './ContactEditModalV3'
import { useProjectContactV3 } from '../hooks/useProjectContactV3'

interface TeamUser { id: string; name: string; email: string }

interface Props {
  project: ProjectV2
  users: TeamUser[]
  onContactSaved?: () => void | Promise<void>
}

function RightSection({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

export function ProjectV3RightSidebar({ project, users, onContactSaved }: Props) {
  const assignee = users.find((u) => u.id === project.assigned_to)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const { contact, refetch: refetchContact } = useProjectContactV3(project.client_id)

  const hasLinkedContact = !!project.client_id
  const actionLabel = hasLinkedContact ? 'Modifier' : 'Ajouter'
  const ActionIcon = hasLinkedContact ? Pencil : Plus

  return (
    <div className="flex flex-col">
      {/* Contact client */}
      <RightSection
        title="Contact client"
        action={
          <button
            onClick={() => setContactModalOpen(true)}
            className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-0.5 transition-colors"
          >
            <ActionIcon className="h-3 w-3" /> {actionLabel}
          </button>
        }
      >
        {hasLinkedContact && contact ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
                <Building2 className="h-3.5 w-3.5 text-[#8B5CF6]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#ede9fe] truncate">{contact.name}</p>
                {contact.company && (
                  <p className="text-[10px] text-[#9ca3af] truncate">{contact.company}</p>
                )}
              </div>
            </div>
            {contact.email && (
              <ContactCoord icon={Mail} value={contact.email} href={`mailto:${contact.email}`} />
            )}
            {contact.phone && (
              <ContactCoord icon={Phone} value={contact.phone} href={`tel:${contact.phone}`} />
            )}
            {!contact.email && !contact.phone && (
              <p className="text-[10px] text-[#9ca3af] italic">Aucune coordonnée renseignée</p>
            )}
          </div>
        ) : project.client_name ? (
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-[#8B5CF6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#ede9fe]">{project.client_name}</p>
              <p className="text-[10px] text-[#9ca3af] italic">Cliquer sur « Ajouter » pour créer un contact</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#9ca3af] italic">Aucun client renseigné</p>
        )}
      </RightSection>

      {/* Suivi de l'étape du projet */}
      <RightSection title="Suivi de l'étape du projet">
        <div className="space-y-1.5">
          {PROJECT_STATUS_ORDER.map((s) => {
            const conf = getStatusStyle(s)
            const isActive = s === project.status
            return (
              <div
                key={s}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all',
                  isActive
                    ? cn('border font-semibold', conf.badge, 'border-current/30')
                    : 'text-[#9ca3af]',
                )}
              >
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    isActive ? 'bg-current' : 'bg-[rgba(139,92,246,0.2)]',
                  )}
                />
                {PROJECT_STATUS_LABELS[s]}
                {isActive && <span className="ml-auto text-[10px]">● Actuel</span>}
              </div>
            )
          })}
        </div>
      </RightSection>

      {/* Responsable */}
      {assignee && (
        <RightSection title="Responsable">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[#171030] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
              <User className="h-3 w-3 text-[#9ca3af]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#ede9fe]">{assignee.name}</p>
              <p className="text-[10px] text-[#9ca3af]">{assignee.email}</p>
            </div>
          </div>
        </RightSection>
      )}

      {contactModalOpen && (
        <ContactEditModalV3
          contactId={project.client_id ?? null}
          projectId={project.id}
          defaultClientName={project.client_name}
          onClose={() => setContactModalOpen(false)}
          onSaved={async () => {
            await refetchContact()
            if (onContactSaved) await onContactSaved()
          }}
        />
      )}
    </div>
  )
}

function ContactCoord({
  icon: Icon,
  value,
  href,
}: {
  icon: React.ElementType
  value: string
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 text-[10px] text-[#9ca3af] hover:text-[#ede9fe] transition-colors group"
    >
      <Icon className="h-3 w-3 shrink-0 group-hover:text-[#A78BFA]" />
      <span className="truncate">{value}</span>
    </a>
  )
}
