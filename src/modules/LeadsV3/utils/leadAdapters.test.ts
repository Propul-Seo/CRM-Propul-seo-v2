import { describe, it, expect } from 'vitest'
import { matchesQuery, siteWebToCard, erpToCard } from './leadAdapters'
import type { LeadCardData } from '../components/LeadCardV3'

const baseCard: LeadCardData = {
  id: 'lead-1',
  company: 'Acme Corp',
  contact: 'Jean Dupont',
  email: 'jean@acme.fr',
  phone: '0601020304',
  statusColor: '#8B5CF6',
  statusLabel: 'Prospect',
  assignee: 'Etienne',
  source: 'Linkedin',
  createdAt: '2026-05-01T10:00:00Z',
  lastActivityAt: '2026-05-02T10:00:00Z',
  lastActivityLabel: 'Dernière activité',
  amount: 1500,
}

describe('matchesQuery', () => {
  it('retourne true si query vide', () => {
    expect(matchesQuery(baseCard, '')).toBe(true)
  })

  it('match sur company (case-insensitive)', () => {
    expect(matchesQuery(baseCard, 'acme')).toBe(true)
    expect(matchesQuery(baseCard, 'ACME')).toBe(true)
    expect(matchesQuery(baseCard, 'corp')).toBe(true)
  })

  it('match sur contact', () => {
    expect(matchesQuery(baseCard, 'dupont')).toBe(true)
    expect(matchesQuery(baseCard, 'JEAN')).toBe(true)
  })

  it('match sur email', () => {
    expect(matchesQuery(baseCard, 'acme.fr')).toBe(true)
    expect(matchesQuery(baseCard, 'jean@')).toBe(true)
  })

  it('ne match pas sur phone (intentionnel : pas dans la recherche)', () => {
    expect(matchesQuery(baseCard, '0601')).toBe(false)
  })

  it('ne match pas si aucun champ ne contient', () => {
    expect(matchesQuery(baseCard, 'zzzzz')).toBe(false)
  })

  it('gère les champs null sans crash', () => {
    const empty: LeadCardData = { ...baseCard, company: null, contact: null, email: null }
    expect(matchesQuery(empty, 'anything')).toBe(false)
    expect(matchesQuery(empty, '')).toBe(true)
  })
})

describe('erpToCard', () => {
  const buildErpLead = (overrides: Record<string, unknown> = {}) => ({
    id: 'erp-1',
    company_name: 'Tech ERP',
    contact_name: 'Marie Curie',
    email: 'marie@tech.fr',
    phone: '0612345678',
    status: 'leads_contactes',
    source: 'Salon',
    created_at: '2026-04-10T08:00:00Z',
    assignee: { id: 'u1', name: 'Lyes', email: 'lyes@x.fr' },
    assignee_id: 'u1',
    ...overrides,
  })

  it('mappe les champs ERP vers LeadCardData', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card = erpToCard(buildErpLead() as any)
    expect(card.id).toBe('erp-1')
    expect(card.company).toBe('Tech ERP')
    expect(card.contact).toBe('Marie Curie')
    expect(card.assignee).toBe('Lyes')
    expect(card.statusLabel).toBe('Leads contactés')
    expect(card.amount).toBeNull()
  })

  it('fallback statut inconnu vers leads_contactes (pas de undefined)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card = erpToCard(buildErpLead({ status: 'inexistant' }) as any)
    expect(card.statusLabel).toBe('Leads contactés')
    expect(card.statusColor).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('assignee null si pas d\'utilisateur attaché', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card = erpToCard(buildErpLead({ assignee: null }) as any)
    expect(card.assignee).toBeNull()
  })
})

describe('siteWebToCard', () => {
  const buildSwLead = (overrides: Record<string, unknown> = {}) => ({
    id: 'sw-1',
    company: 'WebClient',
    name: 'Paul Martin',
    email: 'paul@web.fr',
    phone: '0699887766',
    normalized_status: 'prospect',
    source: 'Google',
    created_at: '2026-05-12T14:00:00Z',
    assigned_user: { id: 'u1', name: 'Etienne', email: 'et@x.fr' },
    assigned_user_name: null,
    project_price: 2500,
    ...overrides,
  })

  it('mappe les champs Site web vers LeadCardData', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card = siteWebToCard(buildSwLead() as any)
    expect(card.id).toBe('sw-1')
    expect(card.company).toBe('WebClient')
    expect(card.contact).toBe('Paul Martin')
    expect(card.assignee).toBe('Etienne')
    expect(card.amount).toBe(2500)
  })

  it('utilise assigned_user_name si assigned_user absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card = siteWebToCard(buildSwLead({ assigned_user: null, assigned_user_name: 'Lyes' }) as any)
    expect(card.assignee).toBe('Lyes')
  })

  it('assignee null si ni assigned_user ni assigned_user_name', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card = siteWebToCard(buildSwLead({ assigned_user: null, assigned_user_name: null }) as any)
    expect(card.assignee).toBeNull()
  })
})
