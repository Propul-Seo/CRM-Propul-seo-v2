import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProjectV2, PrestaType, ProjectStatusV2 } from '@/types/project-v2'

export interface NewProjectFormState {
  name: string
  client_name: string
  description: string
  presta_type: PrestaType[]
  status: ProjectStatusV2
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string
  budget: string
  start_date: string
  end_date: string
  siret: string
}

export const EMPTY_FORM: NewProjectFormState = {
  name: '',
  client_name: '',
  description: '',
  presta_type: [],
  status: 'brief_received',
  priority: 'medium',
  assigned_to: '',
  budget: '',
  start_date: '',
  end_date: '',
  siret: '',
}

// Pôles V3 alignés sur la sidebar : Communication / ERP / Site Web.
const PRESTA_OPTIONS: { value: PrestaType; label: string }[] = [
  { value: 'communication', label: 'Communication' },
  { value: 'erp',           label: 'ERP' },
  { value: 'site_web',      label: 'Site Web' },
]

interface Props {
  form: NewProjectFormState
  onChange: (next: NewProjectFormState) => void
  users: { id: string; name: string }[]
  saving: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function NewProjectFormV3({ form, onChange, users, saving, onSubmit, onCancel }: Props) {
  const togglePresta = (type: PrestaType) => {
    onChange({
      ...form,
      presta_type: form.presta_type.includes(type)
        ? form.presta_type.filter(t => t !== type)
        : [...form.presta_type, type],
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Le nom du projet est obligatoire')
      return
    }
    if (form.presta_type.length === 0) {
      toast.error('Sélectionnez au moins un type de prestation')
      return
    }
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nom *">
        <input
          type="text" value={form.name} required autoFocus
          onChange={e => onChange({ ...form, name: e.target.value })}
          placeholder="Nom du projet" className={inputCls}
        />
      </Field>
      <Field label="Client">
        <input
          type="text" value={form.client_name}
          onChange={e => onChange({ ...form, client_name: e.target.value })}
          placeholder="Nom du client" className={inputCls}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={form.description} rows={2}
          onChange={e => onChange({ ...form, description: e.target.value })}
          placeholder="Description rapide (optionnel)" className={inputCls}
        />
      </Field>
      <Field label="Type de prestation *">
        <div className="flex gap-2 flex-wrap">
          {PRESTA_OPTIONS.map(({ value, label }) => (
            <button
              key={value} type="button" onClick={() => togglePresta(value)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium border transition-colors',
                form.presta_type.includes(value)
                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]'
                  : 'bg-[#0f0b1e] border-[rgba(139,92,246,0.2)] text-[#9ca3af] hover:border-[#8B5CF6]/50',
              )}
            >{label}</button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Statut">
          <select value={form.status} className={inputCls}
            onChange={e => onChange({ ...form, status: e.target.value as ProjectStatusV2 })}>
            <option value="prospect">Prospect</option>
            <option value="brief_received">Brief reçu</option>
            <option value="quote_sent">Devis envoyé</option>
            <option value="in_progress">En cours</option>
            <option value="review">Recette</option>
            <option value="on_hold">En pause</option>
          </select>
        </Field>
        <Field label="Priorité">
          <select value={form.priority} className={inputCls}
            onChange={e => onChange({ ...form, priority: e.target.value as NewProjectFormState['priority'] })}>
            <option value="low">Basse</option>
            <option value="medium">Normale</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Responsable">
          <select value={form.assigned_to} className={inputCls}
            onChange={e => onChange({ ...form, assigned_to: e.target.value })}>
            <option value="">Non assigné</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Budget (€)">
          <input type="number" value={form.budget} placeholder="0" className={inputCls}
            onChange={e => onChange({ ...form, budget: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de début">
          <input type="date" value={form.start_date} className={inputCls}
            onChange={e => onChange({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="Échéance">
          <input type="date" value={form.end_date} className={inputCls}
            onChange={e => onChange({ ...form, end_date: e.target.value })} />
        </Field>
      </div>

      <Field label="SIRET">
        <input
          type="text" value={form.siret} placeholder="12345678901234" maxLength={20}
          onChange={e => onChange({ ...form, siret: e.target.value })}
          className={cn(inputCls, 'font-mono')}
        />
        <p className="mt-1 text-[10px] text-[#6b7280]">
          L'enrichissement Pappers se fait depuis le détail projet une fois créé.
        </p>
      </Field>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={saving}
          className="flex-1 px-4 py-2 rounded-md text-sm text-[#9ca3af] bg-[#0f0b1e] border border-[rgba(139,92,246,0.2)] hover:bg-[#1a1430] transition-colors disabled:opacity-40">
          Annuler
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#8B5CF6] hover:bg-[#7c3aed] transition-colors disabled:opacity-50">
          {saving ? 'Création…' : 'Créer le projet'}
        </button>
      </div>
    </form>
  )
}

export function toProjectPayload(
  form: NewProjectFormState,
  users: { id: string; name: string }[],
): Omit<ProjectV2, 'id' | 'created_at' | 'updated_at'> {
  const assignedUser = users.find(u => u.id === form.assigned_to)
  // La colonne v2.projects.client_name est NOT NULL en BDD : si l'utilisateur
  // ne renseigne pas le client, on fallback sur le nom du projet (au pire on
  // affiche le projet comme son propre client, c'est cohérent et évite un échec).
  const clientName = form.client_name.trim() || form.name.trim()
  return {
    name: form.name.trim(),
    client_name: clientName,
    description: form.description.trim() || null,
    status: form.status,
    priority: form.priority,
    presta_type: form.presta_type,
    category: form.presta_type[0],
    assigned_to: form.assigned_to || null,
    assigned_name: assignedUser?.name ?? null,
    budget: form.budget ? parseFloat(form.budget) : null,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    siret: form.siret.trim() || null,
    progress: 0,
    is_archived: false,
  } as Omit<ProjectV2, 'id' | 'created_at' | 'updated_at'>
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
