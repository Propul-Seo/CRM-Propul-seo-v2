import { describe, it, expect } from 'vitest'
import { matchesQuery, siteWebToCard, erpToCard, sortSiteWebLeads, sortErpLeads } from './leadAdapters'
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

describe('sortSiteWebLeads (urgence : activité la plus ancienne en tête)', () => {
  const swLead = (id: string, overrides: Record<string, unknown> = {}) => ({
    id,
    normalized_status: 'prospect',
    created_at: '2026-06-01T10:00:00Z',
    ...overrides,
  })

  it('place le lead à la dernière activité la plus ancienne en premier', () => {
    const leads = [
      swLead('recent', { last_activity_at: '2026-06-28T10:00:00Z' }),
      swLead('ancien', { last_activity_at: '2026-03-01T10:00:00Z' }),
      swLead('moyen', { last_activity_at: '2026-05-15T10:00:00Z' }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sortSiteWebLeads(leads as any).map(l => l.id)).toEqual(['ancien', 'moyen', 'recent'])
  })

  it('sans activité, retombe sur updated_at/created_at : un vieux lead jamais touché remonte', () => {
    const leads = [
      swLead('touche-hier', { last_activity_at: '2026-07-01T10:00:00Z' }),
      swLead('jamais-touche-vieux', { last_activity_at: null, updated_at: '2026-02-01T10:00:00Z' }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sortSiteWebLeads(leads as any).map(l => l.id)).toEqual(['jamais-touche-vieux', 'touche-hier'])
  })

  it('une relance planifiée dans le futur descend en bas (lead pris en charge)', () => {
    const leads = [
      swLead('relance-future', { last_activity_at: null, next_activity_date: '2027-01-01T10:00:00Z' }),
      swLead('a-relancer', { last_activity_at: '2026-04-01T10:00:00Z' }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sortSiteWebLeads(leads as any).map(l => l.id)).toEqual(['a-relancer', 'relance-future'])
  })

  it('ne mute pas le tableau d\'entrée', () => {
    const leads = [
      swLead('b', { last_activity_at: '2026-06-01T10:00:00Z' }),
      swLead('a', { last_activity_at: '2026-01-01T10:00:00Z' }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sortSiteWebLeads(leads as any)
    expect(leads.map(l => l.id)).toEqual(['b', 'a'])
  })
})

describe('sortErpLeads (urgence : activité la plus ancienne en tête)', () => {
  it('trie du plus ancien signal au plus récent', () => {
    const erpLead = (id: string, overrides: Record<string, unknown> = {}) => ({
      id,
      status: 'leads_contactes',
      created_at: '2026-06-01T10:00:00Z',
      ...overrides,
    })
    const leads = [
      erpLead('recent', { last_activity_at: '2026-06-20T10:00:00Z' }),
      erpLead('ancien', { last_activity_at: '2026-02-10T10:00:00Z' }),
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sortErpLeads(leads as any).map(l => l.id)).toEqual(['ancien', 'recent'])
  })
})
