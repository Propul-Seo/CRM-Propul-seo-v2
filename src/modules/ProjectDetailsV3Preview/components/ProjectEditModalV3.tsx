import { useState } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { ProjectV2, ProjectStatusV2, PrestaType } from '@/types/project-v2'
import { getProjectAssigneeLabel } from '@/modules/ProjectsV3/utils/projectAssignees'
import { ProjectAssigneeButtons } from '@/modules/ProjectsV3/components/ProjectAssigneeButtons'

interface TeamUser { id: string; name: string; email?: string | null }

import { PropulspaceDangerZone } from '@/modules/EspaceClient/admin/components/PropulspaceDangerZone'

interface Props {
  project: ProjectV2
  users: TeamUser[]
  onSave: (updates: Partial<ProjectV2>) => Promise<void>
  onClose: () => void
  onDeleted?: () => void
}

export function ProjectEditModalV3({ project, users, onSave, onClose, onDeleted }: Props) {
  const [form, setForm] = useState({
    name:        project.name,
    description: project.description ?? '',
    status:      project.status,
    priority:    project.priority,
    presta_type: project.presta_type ?? [],
    assigned_to: project.assigned_to ?? '',
    budget:      project.budget != null ? String(project.budget) : '',
    start_date:  project.start_date ?? '',
    end_date:    project.end_date ?? '',
    client_name: project.client_name ?? '',
    siret:       project.siret ?? '',
  })
  const [enriching, setEnriching] = useState(false)
  const [enrichedName, setEnrichedName] = useState<string | null>(
    project.company_enriched_at
      ? (project.company_data as { nom_entreprise?: string; denomination?: string } | null)?.nom_entreprise
        ?? (project.company_data as { nom_entreprise?: string; denomination?: string } | null)?.denomination
        ?? null
      : null,
  )
  const [saving, setSaving] = useState(false)

  const togglePrestaType = (type: PrestaType) => {
    setForm((prev) => ({
      ...prev,
      presta_type: prev.presta_type.includes(type)
        ? prev.presta_type.filter((t) => t !== type)
        : [...prev.presta_type, type],
    }))
  }

  const handleEnrich = async () => {
    const cleanSiret = form.siret.replace(/\s/g, '')
    if (!/^\d{14}$/.test(cleanSiret)) {
      toast.error('SIRET invalide — 14 chiffres requis')
      return
    }
    setEnriching(true)
    try {
      const { data, error } = await supabase.functions.invoke('enrich-siret', {
        body: { project_id: project.id, siret: cleanSiret },
      })
      if (error) throw error
      setEnrichedName(data.company_name ?? null)
      setForm((prev) => ({ ...prev, siret: cleanSiret }))
      toast.success(`Données enrichies via Pappers${data.company_name ? ` — ${data.company_name}` : ''}`)
    } catch (err) {
      toast.error('Erreur lors de l\'enrichissement Pappers')
      console.error('[enrich-siret]', err)
    } finally {
      setEnriching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Le nom du projet est obligatoire')
      return
    }
    setSaving(true)
    const assignedUser = users.find((u) => u.id === form.assigned_to)
    try {
      await onSave({
        name:          form.name.trim(),
        description:   form.description.trim() || null,
        status:        form.status as ProjectStatusV2,
        priority:      form.priority as ProjectV2['priority'],
        presta_type:   form.presta_type,
        assigned_to:   form.assigned_to || null,
        assigned_name: getProjectAssigneeLabel(assignedUser),
        budget:        form.budget ? parseFloat(form.budget) : null,
        start_date:    form.start_date || null,
        end_date:      form.end_date || null,
        client_name:   form.client_name.trim() || null,
        category:      form.presta_type[0] ?? project.category,
        siret:         form.siret.trim() || null,
      })
      onClose()
    } catch (err) {
      // L'erreur est déjà toastée par useProjectUpdateV3.updateProject — on garde le modal ouvert.
      console.error('[project-save]', err)
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
        className="bg-[#070512] border border-[rgba(139,92,246,0.25)] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#ede9fe]">Modifier le projet</h3>
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

          <Field label="Client">
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              placeholder="Nom du client"
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </Field>

          <Field label="Type de prestation">
            <div className="flex gap-2 flex-wrap">
              {(['web', 'seo', 'erp', 'saas'] as PrestaType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => togglePrestaType(type)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium border transition-colors',
                    form.presta_type.includes(type)
                      ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]'
                      : 'bg-[#0f0b1e] border-[rgba(139,92,246,0.2)] text-[#9ca3af] hover:border-[#8B5CF6]/50',
                  )}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Statut">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatusV2 })}
                className={inputCls}
              >
                <option value="prospect">Prospect</option>
                <option value="brief_received">Brief reçu</option>
                <option value="quote_sent">Devis envoyé</option>
                <option value="in_progress">En cours</option>
                <option value="review">Recette</option>
                <option value="delivered">Livré</option>
                <option value="maintenance">Maintenance</option>
                <option value="on_hold">En pause</option>
                <option value="closed">Clôturé</option>
                <option value="propulseo_internal">Projet Propulseo</option>
              </select>
            </Field>
            <Field label="Priorité">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as ProjectV2['priority'] })}
                className={inputCls}
              >
                <option value="low">Basse</option>
                <option value="medium">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Responsable">
              <ProjectAssigneeButtons
                users={users}
                value={form.assigned_to}
                onChange={(assigned_to) => setForm({ ...form, assigned_to })}
              />
            </Field>
            <Field label="Budget (€)">
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date de début">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Échéance">
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="SIRET">
            <div className="flex gap-2">
              <input
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                placeholder="12345678901234"
                maxLength={20}
                className={cn(inputCls, 'flex-1 font-mono')}
              />
              <button
                type="button"
                onClick={handleEnrich}
                disabled={enriching || form.siret.replace(/\s/g, '').length !== 14}
                className="px-3 py-2 text-xs rounded-md border border-[#8B5CF6] text-[#A78BFA] hover:bg-[#8B5CF6]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {enriching ? 'En cours...' : 'Enrichir'}
              </button>
            </div>
            {enrichedName && (
              <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                <span>✓</span> Données enrichies via Pappers : <strong>{enrichedName}</strong>
              </p>
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
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[rgba(239,68,68,0.2)]">
            <p className="text-xs font-semibold text-red-400 mb-2">Zone dangereuse</p>
            <PropulspaceDangerZone
              kind="project"
              projectId={project.id}
              projectName={project.name}
              onAfterArchive={() => { onClose(); onDeleted?.() }}
              onAfterDelete={() => { onClose(); onDeleted?.() }}
            />
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
