import { describe, it, expect } from 'vitest'
import { statusToColumn, columnToDefaultStatus, V3_COLUMN_ORDER } from './statusMapping'
import type { ProjectStatusV2 } from '@/types/project-v2'

describe('statusToColumn', () => {
  it.each<ProjectStatusV2>(['in_progress', 'review', 'delivered', 'maintenance'])(
    'mappe %s → actifs (en production)',
    (status) => {
      expect(statusToColumn(status)).toBe('actifs')
    },
  )

  it.each<ProjectStatusV2>(['prospect', 'brief_received', 'quote_sent', 'on_hold', 'closed'])(
    'mappe %s → inactifs (planification + pause)',
    (status) => {
      expect(statusToColumn(status)).toBe('inactifs')
    },
  )

  it('mappe propulseo_internal → propulseo', () => {
    expect(statusToColumn('propulseo_internal')).toBe('propulseo')
  })
})

describe('columnToDefaultStatus', () => {
  it('actifs → in_progress', () => {
    expect(columnToDefaultStatus('actifs')).toBe('in_progress')
  })
  it('inactifs → on_hold', () => {
    expect(columnToDefaultStatus('inactifs')).toBe('on_hold')
  })
  it('propulseo → propulseo_internal', () => {
    expect(columnToDefaultStatus('propulseo')).toBe('propulseo_internal')
  })
})

describe('Round-trip column → status → column', () => {
  it('chaque colonne survit au round-trip', () => {
    for (const col of V3_COLUMN_ORDER) {
      expect(statusToColumn(columnToDefaultStatus(col))).toBe(col)
    }
  })
})
