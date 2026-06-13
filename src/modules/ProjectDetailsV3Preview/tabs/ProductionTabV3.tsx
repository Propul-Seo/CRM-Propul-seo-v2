import { useState } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { useChecklistV3 } from '../hooks/useChecklistV3'
import { useIsProjectV3Admin } from '../hooks/useIsProjectV3Admin'
import { useUsers } from '@/hooks/useUsers'
import { ProductionPhase } from './production/ProductionPhase'
import { PHASE_LABELS, PHASE_ORDER, PRESTA_LABELS } from './production/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TEMPLATES } from './production/templates'
import type { ProjectV2, ChecklistPhase, ChecklistStatus, PrestaType } from '@/types/project-v2'

type ChecklistPriority = 'low' | 'medium' | 'high' | 'urgent'

const PRIORITY_LABELS: Record<ChecklistPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
}

interface Props {
  project: ProjectV2
  checklist: ReturnType<typeof useChecklistV3>
}

export function ProductionTabV3({ project, checklist }: Props) {
  const { items, loading, pendingIds, progress, progressByPhase, setItemStatus, addItem, addItems, deleteItem } =
    checklist
  const { isAdmin } = useIsProjectV3Admin()
  const { users, activeUsers } = useUsers()

  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)
  const [collapsed, setCollapsed] = useState<Partial<Record<ChecklistPhase, boolean>>>({})
  const [newTitle, setNewTitle] = useState('')
  const [newPhase, setNewPhase] = useState<ChecklistPhase>('onboarding')
  const [newPriority, setNewPriority] = useState<ChecklistPriority>('medium')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const togglePhase = (phase: ChecklistPhase) =>
    setCollapsed((prev) => ({ ...prev, [phase]: !prev[phase] }))

  const cycleStatus = async (id: string, current: ChecklistStatus) => {
    // Cycle 2 états : 1 clic valide, re-clic décoche.
    // Les anciens items en `in_progress` ou `skipped` (legacy) sont traités comme "à faire" :
    // un clic dessus les passe directement à `done`.
    // La progression affichée en sidebar/Synthèse est dérivée du même hook checklist
    // partagé (hissé dans index.tsx), donc elle se met à jour automatiquement
    // sans refetch — pas besoin d'appeler onProgressUpdated ici.
    const next: ChecklistStatus = current === 'done' ? 'todo' : 'done'
    try {
      await setItemStatus(id, next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de changer le statut')
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const user = users.find((u) => u.id === newAssignedTo)
    try {
      await addItem({
        project_id: project.id,
        parent_task_id: null,
        title: newTitle.trim(),
        phase: newPhase,
        status: 'todo',
        priority: newPriority,
        assigned_to: user?.id ?? null,
        assigned_name: user?.name ?? null,
        due_date: null,
        position: items.length + 1,
      })
      setNewTitle('')
      setNewAssignedTo('')
      setNewPriority('medium')
      setShowAdd(false)
      toast.success('Tâche ajoutée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'ajouter la tâche")
    }
  }

  const handleAddSubTask = async (parentId: string, subTitle: string) => {
    const parent = items.find((i) => i.id === parentId)
    if (!parent) return
    try {
      await addItem({
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'ajouter la sous-tâche")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id)
      toast.success('Tâche supprimée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de supprimer la tâche')
    }
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
    try {
      await addItems(allItems)
      toast.success(`Template ${PRESTA_LABELS[type]} appliqué (${tasks.length} tâches)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'appliquer le template")
    } finally {
      setIsApplyingTemplate(false)
    }
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
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={newPhase} onValueChange={(v) => setNewPhase(v as ChecklistPhase)}>
              <SelectTrigger className="w-[160px] h-8 bg-surface-3 border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top" align="start" avoidCollisions={false}>
                {PHASE_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>{PHASE_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newPriority} onValueChange={(v) => setNewPriority(v as ChecklistPriority)}>
              <SelectTrigger className="w-[140px] h-8 bg-surface-3 border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top" align="start" avoidCollisions={false}>
                {(['low', 'medium', 'high', 'urgent'] as ChecklistPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newAssignedTo === '' ? '__none__' : newAssignedTo}
              onValueChange={(v) => setNewAssignedTo(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="w-[180px] h-8 bg-surface-3 border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top" align="start" avoidCollisions={false}>
                <SelectItem value="__none__">Non assigné</SelectItem>
                {activeUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            pendingIds={pendingIds}
            onToggle={() => togglePhase(phase)}
            onCycleStatus={cycleStatus}
            onAddSubTask={handleAddSubTask}
            onDelete={handleDelete}
            canDelete={isAdmin}
          />
        ))
      )}
    </div>
  )
}
