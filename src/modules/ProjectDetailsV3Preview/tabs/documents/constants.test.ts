import { describe, it, expect } from 'vitest'
import { inferBucket } from './constants'

// inferBucket réplique le CASE de la vue 254 (mig 20260521170000, l.70-74).
// Les 3 cas de la spec SP4 §5 + quelques variantes (casse/https).
describe('inferBucket', () => {
  it("doc qualif -> propulspace-uploads", () => {
    expect(inferBucket('qualification/logo.png')).toBe('propulspace-uploads')
    expect(inferBucket('qualification/sub/charte.pdf')).toBe('propulspace-uploads')
  })

  it('lien externe (http/https) -> external', () => {
    expect(inferBucket('http://exemple.com/charte')).toBe('external')
    expect(inferBucket('https://figma.com/file/abc')).toBe('external')
  })

  it('path projet (uuid/...) -> propulspace-documents (défaut)', () => {
    expect(inferBucket('123e4567-e89b-12d3-a456-426614174000/1700000000_v1_doc.pdf')).toBe(
      'propulspace-documents',
    )
    expect(inferBucket('autre/chemin/fichier.txt')).toBe('propulspace-documents')
  })
})
