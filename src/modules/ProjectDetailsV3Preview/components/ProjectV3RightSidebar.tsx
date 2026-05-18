import { useState } from 'react'
import { User, Plus, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProjectV2, ProjectStatusV2, ProjectContactRole } from '@/types/project-v2'
import {
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_LABELS,
  getStatusStyle,
} from '../statusConfig'
import { ContactEditModalV3 } from './ContactEditModalV3'
import { AddProjectContactModalV3 } from './AddProjectContactModalV3'
import { ContactCardV3 } from './ContactCardV3'
import { PipelineSelect } from './pipeline-previews/PipelineSelect'
import { useProjectContactsV3 } from '../hooks/useProjectContactsV3'
import { PortalStatusSection } from '@/modules/EspaceClient/admin/components/PortalStatusSection'
import { usePropulspaceAdmin } from '@/modules/EspaceClient/admin/hooks/usePropulspaceAdmin'

interface TeamUser { id: string; name: string; email: string }

interface Props {
  project: ProjectV2
  users: TeamUser[]
  onContactSaved?: () => void | Promise<void>
  onAssign?: (userId: string | null) => void | Promise<void>
  onStatusChange?: (status: ProjectStatusV2) => void | Promise<void>
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

export function ProjectV3RightSidebar({ project, users, onContactSaved, onAssign, onStatusChange }: Props) {
  const assignee = users.find((u) => u.id === project.assigned_to)
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [editContactId, setEditContactId] = useState<string | null>(null)
  const [showAssignSelect, setShowAssignSelect] = useState(false)
  const adminState = usePropulspaceAdmin()
  const isAdmin = adminState.status === 'authorized' && adminState.role === 'admin'
  const {
    contacts,
    refetch: refetchContacts,
    createAndLink,
    unlinkContact,
    setRole,
  } = useProjectContactsV3(project.id)

  const takenRoles = contacts.map((c) => c.role)
  // Email suggéré pour pré-remplir le dialog d'activation : 1er contact lié au projet.
  const suggestedPortalEmail = contacts[0]?.contact?.email ?? null
  // Nom du contact principal (s'il existe) : sert à masquer les champs de création
  // dans le dialog d'activation pour éviter le doublon (contrainte unique 23505).
  const primaryContact = contacts.find((c) => c.role === 'primary')?.contact ?? null
  const primaryContactName = primaryContact?.name ?? null

  const handleContactSaved = async () => {
    await refetchContacts()
    if (onContactSaved) await onContactSaved()
  }

  const handlePortalRefresh = async () => {
    if (onContactSaved) await onContactSaved()
  }

  return (
    <div className="flex flex-col">
      {/* Portail client (admin only) */}
      <PortalStatusSection
        project={{
          id: project.id,
          name: project.name,
          portal_client_email: project.portal_client_email ?? null,
          portal_previous_client_email: project.portal_previous_client_email ?? null,
        }}
        isAdmin={isAdmin}
        suggestedEmail={suggestedPortalEmail}
        primaryContactName={primaryContactName}
        onRefresh={handlePortalRefresh}
        onCreateContact={async ({ name, email, phone }) => {
          const ok = await createAndLink({ name, email, phone: phone ?? null, company: null }, 'primary')
          if (ok) {
            await refetchContacts()
            if (onContactSaved) await onContactSaved()
          }
          return ok
        }}
      />

      {/* Contact client (multi-contacts) */}
      <RightSection
        title={`Contact client${contacts.length > 1 ? ` · ${contacts.length}` : ''}`}
        action={
          <button
            onClick={() => setAddContactOpen(true)}
            className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-0.5 transition-colors"
          >
            <Plus className="h-3 w-3" /> Ajouter
          </button>
        }
      >
        {contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map((link) => (
              <ContactCardV3
                key={link.id}
                link={link}
                onEdit={() => setEditContactId(link.contact_id)}
                onChangeRole={(role, customLabel) => setRole(link.id, role, customLabel)}
                onUnlink={() => unlinkContact(link.id)}
              />
            ))}
          </div>
        ) : project.client_name ? (
          <p className="text-xs text-[#9ca3af] italic">
            Client : <span className="text-[#ede9fe] font-medium not-italic">{project.client_name}</span>
            <br />
            <span className="text-[10px]">Cliquer sur « Ajouter » pour créer un contact</span>
          </p>
        ) : (
          <p className="text-xs text-[#9ca3af] italic">Aucun contact lié au projet</p>
        )}
      </RightSection>

      {/* Pipeline — sélecteur rapide + visualisation des étapes */}
      <div className="border-b border-[rgba(139,92,246,0.15)] py-4 px-4 space-y-3">
        <PipelineSelect status={project.status} onChange={onStatusChange} />
        <div className="space-y-1">
          {PROJECT_STATUS_ORDER.map((s) => {
            const conf = getStatusStyle(s)
            const isActive = s === project.status
            return (
              <div
                key={s}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-all',
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
                {isActive && <span className="ml-auto text-[9px]">● Actuel</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Responsable */}
      <RightSection
        title="Responsable"
        action={
          onAssign && assignee && !showAssignSelect ? (
            <button
              onClick={() => setShowAssignSelect(true)}
              className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-0.5 transition-colors"
            >
              <Pencil className="h-3 w-3" /> Changer
            </button>
          ) : null
        }
      >
        {showAssignSelect && onAssign ? (
          <Select
            value={project.assigned_to ?? '__none__'}
            onValueChange={async (v) => {
              await onAssign(v === '__none__' ? null : v)
              setShowAssignSelect(false)
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-[#0f0b1e] border-[rgba(139,92,246,0.25)]">
              <SelectValue placeholder="Choisir un responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Non assigné</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : assignee ? (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[#171030] border border-[rgba(139,92,246,0.2)] flex items-center justify-center shrink-0">
              <User className="h-3 w-3 text-[#9ca3af]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#ede9fe] truncate">{assignee.name}</p>
              <p className="text-[10px] text-[#9ca3af] truncate">{assignee.email}</p>
            </div>
          </div>
        ) : onAssign ? (
          <button
            onClick={() => setShowAssignSelect(true)}
            className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1 transition-colors"
          >
            <Plus className="h-3 w-3" /> Assigner un responsable
          </button>
        ) : (
          <p className="text-xs text-[#9ca3af] italic">Non assigné</p>
        )}
      </RightSection>

      {addContactOpen && (
        <AddProjectContactModalV3
          takenRoles={takenRoles}
          onClose={() => setAddContactOpen(false)}
          onSubmit={async (data, role, customLabel) => {
            const ok = await createAndLink(data, role, customLabel)
            if (ok && onContactSaved) await onContactSaved()
            return ok
          }}
        />
      )}

      {editContactId && (
        <ContactEditModalV3
          contactId={editContactId}
          onClose={() => setEditContactId(null)}
          onSaved={handleContactSaved}
        />
      )}
    </div>
  )
}
