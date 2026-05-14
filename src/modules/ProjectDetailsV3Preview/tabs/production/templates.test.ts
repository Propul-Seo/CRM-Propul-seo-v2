import { describe, it, expect } from 'vitest'
import { TEMPLATES } from './templates'
import type { PrestaType, ChecklistPhase } from '@/types/project-v2'

const ALL_TYPES: PrestaType[] = [
  'web', 'seo', 'erp', 'saas', 'site_web', 'erp_v2', 'communication',
]

const VALID_PHASES: ChecklistPhase[] = [
  'onboarding', 'conception', 'developpement', 'recette', 'post_livraison', 'general',
]

describe('TEMPLATES', () => {
  it('couvre tous les PrestaType', () => {
    for (const t of ALL_TYPES) {
      expect(TEMPLATES[t]).toBeDefined()
      expect(Array.isArray(TEMPLATES[t])).toBe(true)
      expect(TEMPLATES[t].length).toBeGreaterThan(0)
    }
  })

  it('utilise uniquement des phases valides', () => {
    for (const t of ALL_TYPES) {
      for (const task of TEMPLATES[t]) {
        expect(VALID_PHASES).toContain(task.phase)
      }
    }
  })

  it('titres non vides et trimés', () => {
    for (const t of ALL_TYPES) {
      for (const task of TEMPLATES[t]) {
        expect(task.title.length).toBeGreaterThan(0)
        expect(task.title.trim()).toBe(task.title)
      }
    }
  })

  describe('site_web V3 (template production actif)', () => {
    const tasks = TEMPLATES.site_web

    it('contient 18 tâches sur 5 phases', () => {
      expect(tasks).toHaveLength(18)
      const phases = new Set(tasks.map(t => t.phase))
      expect(phases.has('onboarding')).toBe(true)
      expect(phases.has('conception')).toBe(true)
      expect(phases.has('developpement')).toBe(true)
      expect(phases.has('recette')).toBe(true)
      expect(phases.has('post_livraison')).toBe(true)
    })

    it('inclut les tâches métier clés', () => {
      const titles = tasks.map(t => t.title.toLowerCase())
      expect(titles.some(t => t.includes('audit'))).toBe(true)
      expect(titles.some(t => t.includes('supabase'))).toBe(true)
      expect(titles.some(t => t.includes('coolify'))).toBe(true)
      expect(titles.some(t => t.includes('seo technique'))).toBe(true)
      expect(titles.some(t => t.includes('rgpd'))).toBe(true)
    })
  })

  describe('erp_v2 V3 (template ERP actif)', () => {
    const tasks = TEMPLATES.erp_v2

    it('contient 17 tâches sur 5 phases', () => {
      expect(tasks).toHaveLength(17)
      const phases = new Set(tasks.map(t => t.phase))
      expect(phases.size).toBe(5)
    })

    it('inclut les tâches métier ERP clés', () => {
      const titles = tasks.map(t => t.title.toLowerCase())
      expect(titles.some(t => t.includes('cdc'))).toBe(true)
      expect(titles.some(t => t.includes('rls') && t.includes('multi-tenant'))).toBe(true)
      expect(titles.some(t => t.includes('seed data'))).toBe(true)
      expect(titles.some(t => t.includes('edge functions'))).toBe(true)
      expect(titles.some(t => t.includes('coolify'))).toBe(true)
      expect(titles.some(t => t.includes('j+30'))).toBe(true)
    })
  })
})
