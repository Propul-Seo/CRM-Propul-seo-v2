import { describe, it, expect } from 'vitest'
import {
  isSiteWebStatus,
  isErpStatus,
  normalizeErpStatus,
  SITE_WEB_STATUS_ORDER,
  ERP_STATUS_ORDER,
  SITE_WEB_STATUS_LABELS,
  ERP_STATUS_LABELS,
  SITE_WEB_STATUS_COLORS,
  ERP_STATUS_COLORS,
} from './leadStatusMapping'

describe('isSiteWebStatus', () => {
  it.each([
    'prospect',
    'presentation_envoyee',
    'meeting_booke',
    'offre_envoyee',
    'en_attente',
    'signe',
  ])('accepte %s', (status) => {
    expect(isSiteWebStatus(status)).toBe(true)
  })

  it.each(['random', '', 'PROSPECT', 'leads_contactes'])('rejette %s', (status) => {
    expect(isSiteWebStatus(status)).toBe(false)
  })
})

describe('isErpStatus', () => {
  it.each(['leads_contactes', 'rendez_vous_effectues', 'en_attente', 'signes'])(
    'accepte %s',
    (status) => {
      expect(isErpStatus(status)).toBe(true)
    },
  )

  it.each(['signe', 'prospect', 'unknown', ''])('rejette %s', (status) => {
    expect(isErpStatus(status)).toBe(false)
  })
})

describe('normalizeErpStatus', () => {
  it('retourne le statut si valide', () => {
    expect(normalizeErpStatus('leads_contactes')).toBe('leads_contactes')
    expect(normalizeErpStatus('signes')).toBe('signes')
  })

  it('fallback leads_contactes si null/undefined/empty', () => {
    expect(normalizeErpStatus(null)).toBe('leads_contactes')
    expect(normalizeErpStatus(undefined)).toBe('leads_contactes')
    expect(normalizeErpStatus('')).toBe('leads_contactes')
  })

  it('fallback leads_contactes si statut inconnu', () => {
    expect(normalizeErpStatus('invented_status')).toBe('leads_contactes')
    expect(normalizeErpStatus('signe')).toBe('leads_contactes') // statut site web ≠ ERP
  })
})

describe('Cohérence des mappings de statuts', () => {
  it('chaque statut Site web a un label et une couleur', () => {
    for (const status of SITE_WEB_STATUS_ORDER) {
      expect(SITE_WEB_STATUS_LABELS[status]).toBeTruthy()
      expect(SITE_WEB_STATUS_COLORS[status]).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('chaque statut ERP a un label et une couleur', () => {
    for (const status of ERP_STATUS_ORDER) {
      expect(ERP_STATUS_LABELS[status]).toBeTruthy()
      expect(ERP_STATUS_COLORS[status]).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('SITE_WEB_STATUS_ORDER contient 6 statuts uniques', () => {
    expect(SITE_WEB_STATUS_ORDER).toHaveLength(6)
    expect(new Set(SITE_WEB_STATUS_ORDER).size).toBe(6)
  })

  it('ERP_STATUS_ORDER contient 4 statuts uniques', () => {
    expect(ERP_STATUS_ORDER).toHaveLength(4)
    expect(new Set(ERP_STATUS_ORDER).size).toBe(4)
  })
})
