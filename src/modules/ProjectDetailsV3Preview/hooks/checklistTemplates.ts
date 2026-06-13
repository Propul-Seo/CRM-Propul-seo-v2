// Source unique de vérité pour les templates de checklist V3 :
// `@/modules/ProjectDetailsV3Preview/tabs/production/templates`.
// Ce module convertit chaque template `{phase, title}` en `TemplateItem`
// (avec priority/status/position) pour la matérialisation en BDD.
import { TEMPLATES } from '@/modules/ProjectDetailsV3Preview/tabs/production/templates'
import type { ChecklistItemV2, PrestaType } from '@/types/project-v2'

type TemplateItem = Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>

function templateForPresta(presta: PrestaType): TemplateItem[] {
  const tasks = TEMPLATES[presta] ?? []
  return tasks.map((t, idx) => ({
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
}

/**
 * Concatène les templates de toutes les prestations du projet, dédoublonnés
 * par couple (phase, title) au cas où plusieurs prestas auraient des items
 * identiques. Réindexe les positions globalement.
 */
export function buildTemplateForProject(
  prestaTypes: PrestaType[] | null | undefined,
  projectAssignedTo: string | null,
): TemplateItem[] {
  if (!prestaTypes || prestaTypes.length === 0) return []
  const seen = new Set<string>()
  const merged: TemplateItem[] = []
  for (const presta of prestaTypes) {
    for (const item of templateForPresta(presta)) {
      const key = `${item.phase}::${item.title}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push({ ...item, assigned_to: projectAssignedTo })
    }
  }
  return merged.map((item, idx) => ({ ...item, position: idx + 1 }))
}
