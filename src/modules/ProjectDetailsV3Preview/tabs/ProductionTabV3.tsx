import { useState } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useChecklistV3 } from '../hooks/useChecklistV3'
import { ProductionPhase } from './production/ProductionPhase'
import { PHASE_LABELS, PHASE_ORDER, MOCK_USERS, PRESTA_LABELS } from './production/constants'
import { TEMPLATES } from './production/templates'
import type { ProjectV2, ChecklistPhase, ChecklistStatus, PrestaType } from '@/types/project-v2'

interface Props {
  project: ProjectV2
}

export function ProductionTabV3({ project }: Props) {
  const { items, loading, progress, progressByPhase, setItemStatus, addItem, addItems, deleteItem } =
    useChecklistV3(project.id)

  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)
  const [collapsed, setCollapsed] = useState<Partial<Record<ChecklistPhase, boolean>>>({})
  const [newTitle, setNewTitle] = useState('')
  const [newPhase, setNewPhase] = useState<ChecklistPhase>('general')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const togglePhase = (phase: ChecklistPhase) =>
    setCollapsed((prev) => ({ ...prev, [phase]: !prev[phase] }))

  const cycleStatus = (id: string, current: ChecklistStatus) => {
    const next: Record<ChecklistStatus, ChecklistStatus> = {
      todo: 'in_progress', in_progress: 'done', done: 'todo', skipped: 'todo',
    }
    setItemStatus(id, next[current])
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const user = MOCK_USERS.find((u) => u.id === newAssignedTo)
    addItem({
      project_id: project.id,
      parent_task_id: null,
      title: newTitle.trim(),
      phase: newPhase,
      status: 'todo',
      priority: 'medium',
      assigned_to: user?.id ?? null,
      assigned_name: user?.name ?? null,
      due_date: null,
      position: items.length + 1,
    })
    setNewTitle('')
    setNewAssignedTo('')
    setShowAdd(false)
    toast.success('Tâche ajoutée')
  }

  const handleAddSubTask = (parentId: string, subTitle: string) => {
    const parent = items.find((i) => i.id === parentId)
    if (!parent) return
    addItem({
      project_id: project.id,
      parent_task_id: parentId,
      title: subTitle,
      phase: parent.phase,
      status: 'todo',
      priority: parent.priority,
      assigned_to: null,
      assigned_name: null,
      due_date: null,
      position: items.length + 1,
    })
    toast.success('Sous-tâche ajoutée')
  }

  const handleDelete = (id: string) => {
    deleteItem(id)
    toast.success('Tâche supprimée')
  }

  const applyTemplate = async (type: PrestaType) => {
    if (isApplyingTemplate) return
    setIsApplyingTemplate(true)
    const tasks = TEMPLATES[type]
    const allItems = tasks.map((t, idx) => ({
      project_id: project.id,
      parent_task_id: null,
      title: t.title,
      phase: t.phase,
      status: 'todo' as const,
      priority: 'medium' as const,
      assigned_to: null,
      assigned_name: null,
      due_date: null,
      position: idx + 1,
    }))
    await addItems(allItems)
    setIsApplyingTemplate(false)
    toast.success(`Template ${PRESTA_LABELS[type]} appliqué (${tasks.length} tâches)`)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  const rootItems = items.filter((i) => i.parent_task_id === null)
  const activePhases = PHASE_ORDER.filter((p) => progressByPhase[p].total > 0)

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      {/* Progression globale */}
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Progression globale</span>
          <span className="text-sm font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {rootItems.filter((i) => i.status === 'done').length} / {rootItems.length} tâches terminées
        </p>
      </div>

      {/* Templates si checklist vide */}
      {items.length === 0 && (project.presta_type?.length ?? 0) > 0 && (
        <div className="bg-surface-2 border border-border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Appliquer un template</p>
          <p className="text-xs text-muted-foreground">
            Initialise la checklist à partir du type de prestation du projet.
          </p>
          <div className="flex flex-wrap gap-2">
            {(project.presta_type ?? []).map((type) => (
              <button
                key={type}
                onClick={() => applyTemplate(type)}
                disabled={isApplyingTemplate}
                className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-md text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Template {PRESTA_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bouton ajout */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter une tâche
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddItem} className="bg-surface-2 border border-primary/30 rounded-lg p-3 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre de la tâche..."
            className="w-full bg-surface-3 border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={newPhase}
              onChange={(e) => setNewPhase(e.target.value as ChecklistPhase)}
              className="bg-surface-3 border border-border rounded-md px-2 py-1 text-sm text-foreground"
            >
              {PHASE_ORDER.map((p) => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
            </select>
            <select
              value={newAssignedTo}
              onChange={(e) => setNewAssignedTo(e.target.value)}
              className="bg-surface-3 border border-border rounded-md px-2 py-1 text-sm text-foreground"
            >
              <option value="">Non assigné</option>
              {MOCK_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button type="submit" className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors">
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1 border border-border rounded-md text-sm text-muted-foreground hover:bg-surface-3 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Phases */}
      {activePhases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune tâche pour ce projet.</p>
          <p className="text-xs mt-1">Ajoutez des tâches ou appliquez un template selon le type de prestation.</p>
        </div>
      ) : (
        activePhases.map((phase) => (
          <ProductionPhase
            key={phase}
            phase={phase}
            rootItems={rootItems.filter((i) => i.phase === phase)}
            allItems={items}
            progress={progressByPhase[phase]}
            collapsed={!!collapsed[phase]}
            onToggle={() => togglePhase(phase)}
            onCycleStatus={cycleStatus}
            onAddSubTask={handleAddSubTask}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  )
}
