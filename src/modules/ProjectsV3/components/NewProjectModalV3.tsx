import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { ProjectV2 } from '@/types/project-v2'
import { NewProjectFormV3, EMPTY_FORM, toProjectPayload, type NewProjectFormState } from './NewProjectFormV3'

interface Props {
  open: boolean
  users: { id: string; name: string }[]
  onClose: () => void
  onCreate: (
    data: Omit<ProjectV2, 'id' | 'created_at' | 'updated_at'>,
  ) => Promise<ProjectV2 | null>
}

export function NewProjectModalV3({ open, users, onClose, onCreate }: Props) {
  const [form, setForm] = useState<NewProjectFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const handleClose = () => {
    if (saving) return
    setForm(EMPTY_FORM)
    onClose()
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await onCreate(toProjectPayload(form, users))
      if (!res) {
        toast.error('La création du projet a échoué')
        return
      }
      toast.success(`Projet "${res.name}" créé`)
      setForm(EMPTY_FORM)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#070512] border border-[rgba(139,92,246,0.25)] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#ede9fe]">Nouveau projet</h3>
          <button
            type="button"
            onClick={handleClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-[#ede9fe] hover:bg-[rgba(139,92,246,0.15)] transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <NewProjectFormV3
          form={form}
          onChange={setForm}
          users={users}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </div>
    </div>
  )
}
