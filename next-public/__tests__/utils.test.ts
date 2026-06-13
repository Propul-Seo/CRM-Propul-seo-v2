import { generateShortCode, cn, formatDate } from '../lib/utils'

describe('generateShortCode', () => {
  it('retourne exactement 8 caractères', () => {
    expect(generateShortCode()).toHaveLength(8)
  })

  it('utilise uniquement les caractères autorisés (pas 0/O/I/l/1)', () => {
    const allowed = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/
    for (let i = 0; i < 50; i++) {
      expect(generateShortCode()).toMatch(allowed)
    }
  })

  it('génère des codes différents à chaque appel', () => {
    const codes = new Set(Array.from({ length: 100 }, generateShortCode))
    expect(codes.size).toBe(100)
  })
})

describe('cn', () => {
  it('concatène des classes', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('ignore les valeurs falsy', () => {
    expect(cn('a', false as unknown as string, undefined, 'b')).toBe('a b')
  })

  it('fusionne les conflits tailwind (dernière valeur gagne)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    const result = formatDate('2026-04-11')
    expect(result).toMatch(/11/)
    expect(result).toMatch(/avril|avr/i)
    expect(result).toMatch(/2026/)
  })

  it('retourne un tiret pour null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('retourne un tiret pour undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })
})
