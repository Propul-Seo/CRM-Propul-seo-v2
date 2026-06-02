import { describe, expect, it } from 'vitest'

import {
  step1Schema,
  step2Schema,
  step4Schema,
  step5Schema,
  stepErp1Schema,
  stepErp4Schema,
} from './schema'

describe('qualification schemas', () => {
  it('valide un secteur de la liste métier', () => {
    expect(step1Schema.safeParse({
      full_name: 'Lyes Triki',
      email: 'lyes@example.com',
      phone: '0612345678',
      company_name: 'Propulseo',
      business_sector: 'startup_tech',
    }).success).toBe(true)
  })

  it('demande une précision quand le secteur est autre', () => {
    expect(step1Schema.safeParse({
      full_name: 'Lyes Triki',
      email: 'lyes@example.com',
      phone: '0612345678',
      company_name: 'Propulseo',
      business_sector: 'autre',
      business_sector_custom: '',
    }).success).toBe(false)

    expect(step1Schema.safeParse({
      full_name: 'Lyes Triki',
      email: 'lyes@example.com',
      phone: '0612345678',
      company_name: 'Propulseo',
      business_sector: 'autre',
      business_sector_custom: 'Formation professionnelle',
    }).success).toBe(true)
  })

  it('refuse les caractères non numériques dans le téléphone, sauf + en préfixe', () => {
    expect(step1Schema.safeParse({
      full_name: 'Lyes Triki',
      email: 'lyes@example.com',
      phone: '06 12 34 56 78',
      company_name: 'Propulseo',
      business_sector: 'startup_tech',
    }).success).toBe(false)

    expect(step1Schema.safeParse({
      full_name: 'Lyes Triki',
      email: 'lyes@example.com',
      phone: '0612345678',
      company_name: 'Propulseo',
      business_sector: 'startup_tech',
    }).success).toBe(true)

    expect(step1Schema.safeParse({
      full_name: 'Lyes Triki',
      email: 'lyes@example.com',
      phone: '+33612345678',
      company_name: 'Propulseo',
      business_sector: 'startup_tech',
    }).success).toBe(true)
  })

  it('rend le trafic et les problèmes obligatoires si un site existe, mais pas son URL', () => {
    expect(step2Schema.safeParse({ has_existing_site: 'non' }).success).toBe(true)

    const result = step2Schema.safeParse({
      has_existing_site: 'oui',
      existing_site_url: '',
      main_problems: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['monthly_traffic', 'main_problems']),
      )
      expect(result.error.issues.map(issue => issue.path.join('.'))).not.toContain('existing_site_url')
    }
  })

  it('demande les détails e-commerce, réservation et autre quand les options sont sélectionnées', () => {
    const result = step4Schema.safeParse({
      desired_features: ['ecommerce', 'reservation', 'autre'],
      desired_features_other: '',
      ecommerce_platform: 'autre',
      ecommerce_platform_other: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toEqual(
        expect.arrayContaining([
          'desired_features_other',
          'ecommerce_platform_other',
          'product_count_range',
          'reservation_type',
        ]),
      )
    }
  })

  it('accepte une charte complète même si les fichiers sont transmis plus tard', () => {
    expect(step5Schema.safeParse({
      has_visual_identity: 'charte_complete',
      logo_file_url: null,
      brand_guide_url: null,
      brand_guide_external_link: '',
    }).success).toBe(true)
  })

  it('accepte un logo existant même si le fichier est transmis plus tard', () => {
    expect(step5Schema.safeParse({
      has_visual_identity: 'juste_logo',
      logo_file_url: null,
    }).success).toBe(true)
  })
})

describe('ERP qualification schemas', () => {
  it('demande le système ERP personnalisé quand "autre" est coché', () => {
    const result = stepErp1Schema.safeParse({
      erp_current_system: ['autre'],
      erp_current_system_other: '',
      erp_data_volume: '<1000',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toContain('erp_current_system_other')
    }
  })

  it('autorise une étape intégrations ERP vide mais valide le champ autre si nécessaire', () => {
    expect(stepErp4Schema.safeParse({}).success).toBe(true)

    const result = stepErp4Schema.safeParse({
      erp_integrations: ['autre'],
      erp_integrations_other: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toContain('erp_integrations_other')
    }
  })
})
