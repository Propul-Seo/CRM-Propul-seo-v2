// Sélection des templates de checklist à matérialiser en BDD selon les
// prestations cochées sur le projet. Source des templates : mocks V2 (purs,
// `assigned_to: null`). On y injecte uniquement l'assigné du projet (UUID).
import { SITEWEB_CHECKLIST_TEMPLATE } from '@/modules/SiteWebManager/mocks/mockSiteWebChecklists'
import { ERP_CHECKLIST_TEMPLATE } from '@/modules/ERPManager/mocks/mockERPChecklists'
import { COMM_CHECKLIST_INSTAGRAM } from '@/modules/CommunicationManager/mocks/mockCommChecklists'
import type { ChecklistItemV2, PrestaType } from '@/types/project-v2'

type TemplateItem = Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>

function templateForPresta(presta: PrestaType): TemplateItem[] {
  switch (presta) {
    case 'web':
    case 'site_web':
      return SITEWEB_CHECKLIST_TEMPLATE
    case 'erp':
    case 'erp_v2':
      return ERP_CHECKLIST_TEMPLATE
    case 'communication':
      return COMM_CHECKLIST_INSTAGRAM
    default:
      return []
  }
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
