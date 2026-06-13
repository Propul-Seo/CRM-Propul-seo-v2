import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PROJECT_CONTACT_ROLE_LABELS,
  type ProjectContactRole,
} from '@/types/project-v2'

const ROLE_OPTIONS: ProjectContactRole[] = ['primary', 'decision_maker', 'technical', 'billing', 'other']

interface Props {
  draftRole: ProjectContactRole
  draftLabel: string
  onRoleChange: (role: ProjectContactRole) => void
  onLabelChange: (label: string) => void
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Éditeur inline du rôle d'un contact dans un projet.
 * Affiche 5 pills + champ texte conditionnel si role='other'.
 */
export function RoleEditorV3({
  draftRole,
  draftLabel,
  onRoleChange,
  onLabelChange,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="space-y-2 p-2 rounded-md bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.15)]">
      <div className="grid grid-cols-2 gap-1">
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRoleChange(r)}
            title={PROJECT_CONTACT_ROLE_LABELS[r]}
            className={cn(
              'px-1.5 py-1 rounded text-[10px] font-medium border transition-colors truncate',
              draftRole === r
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]'
                : 'bg-[#0f0b1e] border-[rgba(139,92,246,0.15)] text-[#9ca3af] hover:border-[#8B5CF6]/40',
            )}
          >
            {PROJECT_CONTACT_ROLE_LABELS[r]}
          </button>
        ))}
      </div>
      {draftRole === 'other' && (
        <input
          type="text"
          value={draftLabel}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Préciser (ex: CEO, Stagiaire…)"
          maxLength={50}
          autoFocus
          className="w-full px-2 py-1 text-[10px] bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] rounded text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]"
        />
      )}
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-6 w-6 rounded flex items-center justify-center text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors"
          aria-label="Annuler"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-6 w-6 rounded flex items-center justify-center text-white bg-[#8B5CF6] hover:bg-[#7c3aed] transition-colors"
          aria-label="Valider"
        >
          <Check className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
