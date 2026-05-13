import { describe, it, expect } from 'vitest'
import { statusToColumn, columnToDefaultStatus, V3_COLUMN_ORDER } from './statusMapping'
import type { ProjectStatusV2 } from '@/types/project-v2'

describe('statusToColumn', () => {
  it.each<ProjectStatusV2>(['prospect', 'brief_received', 'quote_sent'])(
    'mappe %s → planification',
    (status) => {
      expect(statusToColumn(status)).toBe('planification')
    },
  )

  it.each<ProjectStatusV2>(['in_progress', 'review', 'delivered', 'maintenance'])(
    'mappe %s → en_cours',
    (status) => {
      expect(statusToColumn(status)).toBe('en_cours')
    },
  )

  it.each<ProjectStatusV2>(['on_hold', 'closed'])('mappe %s → en_pause', (status) => {
    expect(statusToColumn(status)).toBe('en_pause')
  })
})

describe('columnToDefaultStatus', () => {
  it('planification → brief_received', () => {
    expect(columnToDefaultStatus('planification')).toBe('brief_received')
  })
  it('en_cours → in_progress', () => {
    expect(columnToDefaultStatus('en_cours')).toBe('in_progress')
  })
  it('en_pause → on_hold', () => {
    expect(columnToDefaultStatus('en_pause')).toBe('on_hold')
  })
})

describe('Round-trip column → status → column', () => {
  it('chaque colonne survit au round-trip', () => {
    for (const col of V3_COLUMN_ORDER) {
      expect(statusToColumn(columnToDefaultStatus(col))).toBe(col)
    }
  })
})
