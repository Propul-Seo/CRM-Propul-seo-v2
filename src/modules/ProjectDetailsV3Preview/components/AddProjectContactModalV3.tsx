import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PROJECT_CONTACT_ROLE_LABELS,
  type ProjectContactRole,
} from '@/types/project-v2'

interface Props {
  /** Rôles déjà occupés sur ce projet (pour griser l'option 'primary' si déjà pris). */
  takenRoles: ProjectContactRole[]
  /**
   * Callback de création + liaison.
   * `customLabel` est non-null uniquement pour role='other' avec libellé saisi.
   */
  onSubmit: (
    data: { name: string; email: string; phone: string | null; company: string | null },
    role: ProjectContactRole,
    customLabel: string | null,
  ) => Promise<boolean>
  onClose: () => void
}

const ROLE_OPTIONS: ProjectContactRole[] = ['primary', 'decision_maker', 'technical', 'billing', 'other']

export function AddProjectContactModalV3({ takenRoles, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  })
  // Par défaut : 'primary' si pas pris, sinon 'other'
  const [role, setRole] = useState<ProjectContactRole>(
    takenRoles.includes('primary') ? 'other' : 'primary',
  )
  const [customLabel, setCustomLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nom et email sont obligatoires')
      return
    }
    setSaving(true)
    try {
      const ok = await onSubmit(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          company: form.company.trim() || null,
        },
        role,
        role === 'other' ? (customLabel.trim() || null) : null,
      )
      if (ok) onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      data-state="open"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#070512] border border-[rgba(139,92,246,0.25)] rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#ede9fe]">Ajouter un contact</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Email *">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Entreprise">
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Rôle dans le projet">
            <div className="grid grid-cols-3 gap-1.5">
              {ROLE_OPTIONS.map((r) => {
                const disabled = r === 'primary' && takenRoles.includes('primary')
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => !disabled && setRole(r)}
                    disabled={disabled}
                    title={disabled ? 'Un contact « Principal » existe déjà' : PROJECT_CONTACT_ROLE_LABELS[r]}
                    className={cn(
                      'px-2 py-1.5 rounded-md text-xs font-medium border transition-colors truncate',
                      role === r
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]'
                        : 'bg-[#0f0b1e] border-[rgba(139,92,246,0.2)] text-[#9ca3af] hover:border-[#8B5CF6]/50',
                      disabled && 'opacity-30 cursor-not-allowed hover:border-[rgba(139,92,246,0.2)]',
                    )}
                  >
                    {PROJECT_CONTACT_ROLE_LABELS[r]}
                  </button>
                )
              })}
            </div>
            {role === 'other' && (
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Préciser (optionnel) : CEO, Stagiaire, Comptable externe…"
                maxLength={50}
                className={cn(inputCls, 'mt-2')}
              />
            )}
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md text-sm text-[#9ca3af] bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] hover:bg-[#1a1430] transition-colors disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#8B5CF6] hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
            >
              {saving ? 'Création…' : 'Créer et lier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full p-2 rounded-md text-sm bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] text-[#ede9fe] placeholder:text-[#6b7280] focus:outline-none focus:border-[#8B5CF6]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#9ca3af] mb-1">{label}</label>
      {children}
    </div>
  )
}
