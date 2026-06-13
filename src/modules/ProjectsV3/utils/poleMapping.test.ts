import { describe, it, expect } from 'vitest'
import { getActivePoles, V3_POLE_ORDER, V3_POLE_LABELS, V3_POLE_COLORS } from './poleMapping'

describe('getActivePoles', () => {
  it('retourne [] si null/undefined/vide', () => {
    expect(getActivePoles(null)).toEqual([])
    expect(getActivePoles(undefined)).toEqual([])
    expect(getActivePoles([])).toEqual([])
  })

  it('mappe communication → comm', () => {
    expect(getActivePoles(['communication'])).toEqual(['comm'])
  })

  it('mappe erp et erp_v2 → erp', () => {
    expect(getActivePoles(['erp'])).toEqual(['erp'])
    expect(getActivePoles(['erp_v2'])).toEqual(['erp'])
  })

  it('mappe web, site_web et seo → web', () => {
    expect(getActivePoles(['web'])).toEqual(['web'])
    expect(getActivePoles(['site_web'])).toEqual(['web'])
    expect(getActivePoles(['seo'])).toEqual(['web'])
  })

  it('ignore saas (pas de pôle dédié)', () => {
    expect(getActivePoles(['saas'])).toEqual([])
  })

  it('déduplique les pôles', () => {
    expect(getActivePoles(['web', 'site_web', 'seo'])).toEqual(['web'])
    expect(getActivePoles(['erp', 'erp_v2'])).toEqual(['erp'])
  })

  it('retourne plusieurs pôles dans l\'ordre V3_POLE_ORDER', () => {
    expect(getActivePoles(['web', 'erp', 'communication'])).toEqual(['comm', 'erp', 'web'])
    expect(getActivePoles(['communication', 'web'])).toEqual(['comm', 'web'])
  })
})

describe('Cohérence des mappings de pôles', () => {
  it('chaque pôle a un label et une couleur', () => {
    for (const pole of V3_POLE_ORDER) {
      expect(V3_POLE_LABELS[pole]).toBeTruthy()
      expect(V3_POLE_COLORS[pole]).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('3 pôles uniques', () => {
    expect(V3_POLE_ORDER).toHaveLength(3)
    expect(new Set(V3_POLE_ORDER).size).toBe(3)
  })
})
