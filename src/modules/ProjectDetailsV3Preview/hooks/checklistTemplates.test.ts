import { describe, it, expect } from 'vitest'
import { buildTemplateForProject } from './checklistTemplates'
import { TEMPLATES } from '../tabs/production/templates'

describe('buildTemplateForProject', () => {
  it('retourne [] pour null/undefined/[]', () => {
    expect(buildTemplateForProject(null, null)).toEqual([])
    expect(buildTemplateForProject(undefined, null)).toEqual([])
    expect(buildTemplateForProject([], null)).toEqual([])
  })

  it('mate site_web sur TEMPLATES.site_web (18 tâches)', () => {
    const result = buildTemplateForProject(['site_web'], null)
    expect(result).toHaveLength(TEMPLATES.site_web.length)
    expect(result).toHaveLength(18)
    expect(result[0].title).toBe(TEMPLATES.site_web[0].title)
  })

  it('mate erp_v2 sur TEMPLATES.erp_v2 (17 tâches)', () => {
    const result = buildTemplateForProject(['erp_v2'], null)
    expect(result).toHaveLength(TEMPLATES.erp_v2.length)
    expect(result).toHaveLength(17)
  })

  it('mate communication sur TEMPLATES.communication (7 tâches)', () => {
    const result = buildTemplateForProject(['communication'], null)
    expect(result).toHaveLength(TEMPLATES.communication.length)
    expect(result).toHaveLength(7)
  })

  it('mate legacy web et erp sur leurs templates respectifs', () => {
    expect(buildTemplateForProject(['web'], null)).toHaveLength(TEMPLATES.web.length)
    expect(buildTemplateForProject(['erp'], null)).toHaveLength(TEMPLATES.erp.length)
  })

  it('propage projectAssignedTo dans chaque item', () => {
    const userId = 'abc-123'
    const result = buildTemplateForProject(['site_web'], userId)
    for (const item of result) {
      expect(item.assigned_to).toBe(userId)
    }
  })

  it('met assigned_to à null si non fourni', () => {
    const result = buildTemplateForProject(['site_web'], null)
    for (const item of result) {
      expect(item.assigned_to).toBeNull()
    }
  })

  it('dédoublonne par (phase, title) sur prestations multiples', () => {
    const single = buildTemplateForProject(['site_web'], null)
    const duplicated = buildTemplateForProject(['site_web', 'site_web'], null)
    expect(duplicated).toHaveLength(single.length)
  })

  it('réindexe position globalement de 1 à N', () => {
    const result = buildTemplateForProject(['site_web'], null)
    expect(result[0].position).toBe(1)
    expect(result[result.length - 1].position).toBe(result.length)
  })

  it('retourne [] pour un presta_type inconnu (robustesse défensive)', () => {
    const result = buildTemplateForProject(['valeur_inconnue' as never], null)
    expect(result).toEqual([])
  })

  it('ignore les presta_type inconnus dans un tableau hétérogène', () => {
    const siteWebOnly = buildTemplateForProject(['site_web'], null)
    const mixed = buildTemplateForProject(['site_web', 'valeur_inconnue' as never], null)
    expect(mixed).toHaveLength(siteWebOnly.length)
  })

  it('items générés ont les bonnes valeurs par défaut', () => {
    const result = buildTemplateForProject(['site_web'], null)
    const sample = result[0]
    expect(sample.status).toBe('todo')
    expect(sample.priority).toBe('medium')
    expect(sample.parent_task_id).toBeNull()
    expect(sample.due_date).toBeNull()
    expect(sample.assigned_name).toBeNull()
  })
})
