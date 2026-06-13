import { describe, expect, it } from 'vitest'

import { conditionalRules, resetOrphanFields } from './conditionalRules'
import type { QualificationDraft } from './schema'

describe('conditionalRules', () => {
  it('affiche les détails du site existant uniquement quand un site existe', () => {
    expect(conditionalRules.showExistingSiteDetails({ has_existing_site: 'oui' })).toBe(true)
    expect(conditionalRules.showExistingSiteDetails({ has_existing_site: 'oui_obsolete' })).toBe(true)
    expect(conditionalRules.showExistingSiteDetails({ has_existing_site: 'non' })).toBe(false)
  })

  it('affiche les sous-blocs e-commerce et réservation selon les fonctionnalités choisies', () => {
    const draft: QualificationDraft = { desired_features: ['ecommerce', 'reservation'] }

    expect(conditionalRules.showEcommerceDetails(draft)).toBe(true)
    expect(conditionalRules.showReservationDetails(draft)).toBe(true)
    expect(conditionalRules.showEcommerceDetails({ desired_features: ['blog'] })).toBe(false)
    expect(conditionalRules.showReservationDetails({ desired_features: ['blog'] })).toBe(false)
  })

  it('affiche les uploads de marque selon le niveau de charte', () => {
    expect(conditionalRules.showLogoUpload({ has_visual_identity: 'charte_complete' })).toBe(true)
    expect(conditionalRules.showLogoUpload({ has_visual_identity: 'juste_logo' })).toBe(true)
    expect(conditionalRules.showLogoUpload({ has_visual_identity: 'rien_du_tout' })).toBe(false)

    expect(conditionalRules.showBrandGuideUpload({ has_visual_identity: 'charte_complete' })).toBe(true)
    expect(conditionalRules.showBrandGuideUpload({ has_visual_identity: 'juste_logo' })).toBe(false)
  })
})

describe('resetOrphanFields', () => {
  it('nettoie les détails du site quand le prospect déclare ne pas avoir de site', () => {
    const prev: QualificationDraft = { has_existing_site: 'oui' }
    const next: QualificationDraft = {
      has_existing_site: 'non',
      existing_site_url: 'https://propulseo.test',
      monthly_traffic: '500-2000',
      main_problems: ['design_depasse', 'autre'],
      main_problems_other: 'Autre problème',
      existing_site_screenshots: ['screenshot.png'],
    }

    expect(resetOrphanFields(prev, next)).toMatchObject({
      existing_site_url: '',
      monthly_traffic: undefined,
      main_problems: [],
      main_problems_other: '',
      existing_site_screenshots: [],
    })
  })

  it('nettoie les champs conditionnels quand les options autre, e-commerce ou réservation sont retirées', () => {
    const prev: QualificationDraft = {
      main_goal: 'autre',
      desired_features: ['ecommerce', 'reservation', 'autre'],
      ecommerce_platform: 'autre',
    }
    const next: QualificationDraft = {
      main_goal: 'generer_leads',
      desired_features: ['blog'],
      main_goal_other: 'Objectif spécifique',
      desired_features_other: 'Fonction spécifique',
      ecommerce_platform: 'shopify',
      ecommerce_platform_other: 'Plateforme spécifique',
      product_count_range: '<50',
      reservation_type: 'rdv_professionnel',
    }

    expect(resetOrphanFields(prev, next)).toMatchObject({
      main_goal_other: '',
      desired_features_other: '',
      ecommerce_platform_other: '',
      ecommerce_platform: undefined,
      product_count_range: undefined,
      reservation_type: undefined,
    })
  })

  it('nettoie les fichiers de marque devenus invisibles', () => {
    const prev: QualificationDraft = { has_visual_identity: 'charte_complete' }

    expect(resetOrphanFields(prev, {
      has_visual_identity: 'juste_logo',
      logo_file_url: 'logo.png',
      brand_guide_url: 'charte.pdf',
      brand_guide_external_link: 'https://drive.test/charte',
    })).toMatchObject({
      logo_file_url: 'logo.png',
      brand_guide_url: null,
      brand_guide_external_link: '',
    })

    expect(resetOrphanFields(prev, {
      has_visual_identity: 'rien_du_tout',
      logo_file_url: 'logo.png',
      brand_guide_url: 'charte.pdf',
      brand_guide_external_link: 'https://drive.test/charte',
    })).toMatchObject({
      logo_file_url: null,
      brand_guide_url: null,
      brand_guide_external_link: '',
    })
  })
})
