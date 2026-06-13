import { describe, expect, it } from 'vitest'

import { getStepFlow, shouldSkipBackward, shouldSkipForward } from './flowRouter'

describe('getStepFlow', () => {
  it('retourne le parcours site en 8 étapes', () => {
    expect(getStepFlow('site').map(step => step.key)).toEqual([
      'project_type',
      'identity',
      'situation',
      'objectives',
      'features',
      'brand',
      'budget',
      'finalization',
    ])
  })

  it('retourne le parcours ERP sans les étapes site', () => {
    expect(getStepFlow('erp').map(step => step.key)).toEqual([
      'project_type',
      'identity',
      'erp_system',
      'erp_modules',
      'erp_users',
      'erp_integrations',
      'budget',
      'finalization',
    ])
  })

  it('retourne le parcours hybride site + ERP en 12 étapes', () => {
    expect(getStepFlow('site_erp').map(step => step.key)).toEqual([
      'project_type',
      'identity',
      'situation',
      'objectives',
      'features',
      'brand',
      'erp_system',
      'erp_modules',
      'erp_users',
      'erp_integrations',
      'budget',
      'finalization',
    ])
  })
})

describe('skip logic', () => {
  it('saute objectifs quand le prospect n’a pas encore de site', () => {
    expect(shouldSkipForward('situation', { has_existing_site: 'non' })).toBe(true)
    expect(shouldSkipBackward('features', { has_existing_site: 'non' })).toBe(true)
  })

  it('ne saute pas objectifs quand un site existe ou quand la clé courante ne correspond pas', () => {
    expect(shouldSkipForward('situation', { has_existing_site: 'oui' })).toBe(false)
    expect(shouldSkipForward('identity', { has_existing_site: 'non' })).toBe(false)
    expect(shouldSkipBackward('brand', { has_existing_site: 'non' })).toBe(false)
  })
})
