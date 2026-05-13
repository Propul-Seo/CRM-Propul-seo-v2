import { describe, it, expect } from 'vitest'
import { getPreviewKind, isTooLargeToPreview, PREVIEW_MAX_BYTES } from './documentMimeType'

describe('getPreviewKind', () => {
  describe('PDF', () => {
    it('détecte via MIME application/pdf', () => {
      expect(getPreviewKind('application/pdf', 'rapport.pdf')).toBe('pdf')
    })
    it('détecte via extension .pdf si MIME absent', () => {
      expect(getPreviewKind(null, 'rapport.pdf')).toBe('pdf')
      expect(getPreviewKind('', 'rapport.PDF')).toBe('pdf')
    })
  })

  describe('Images', () => {
    it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])('détecte MIME %s', (mime) => {
      expect(getPreviewKind(mime, 'photo')).toBe('image')
    })
    it.each(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'])(
      'détecte extension .%s sans MIME',
      (ext) => {
        expect(getPreviewKind(null, `photo.${ext}`)).toBe('image')
      },
    )
  })

  describe('Vidéos', () => {
    it('détecte MIME video/mp4', () => {
      expect(getPreviewKind('video/mp4', 'clip.mp4')).toBe('video')
    })
    it.each(['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'])('détecte extension .%s', (ext) => {
      expect(getPreviewKind(null, `clip.${ext}`)).toBe('video')
    })
  })

  describe('Office', () => {
    it.each(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'])(
      'détecte extension .%s',
      (ext) => {
        expect(getPreviewKind(null, `fichier.${ext}`)).toBe('office')
      },
    )
    it('détecte MIME officedocument (DOCX)', () => {
      expect(
        getPreviewKind(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'doc.docx',
        ),
      ).toBe('office')
    })
    it('détecte MIME msword (DOC ancien)', () => {
      expect(getPreviewKind('application/msword', 'old.doc')).toBe('office')
    })
    it('détecte MIME opendocument (ODT)', () => {
      expect(getPreviewKind('application/vnd.oasis.opendocument.text', 'doc.odt')).toBe('office')
    })
  })

  describe('Unsupported', () => {
    it('retourne unsupported pour ZIP', () => {
      expect(getPreviewKind('application/zip', 'archive.zip')).toBe('unsupported')
    })
    it('retourne unsupported pour fichier sans nom ni MIME', () => {
      expect(getPreviewKind(null, null)).toBe('unsupported')
      expect(getPreviewKind(undefined, undefined)).toBe('unsupported')
    })
    it('retourne unsupported pour fichier sans extension', () => {
      expect(getPreviewKind(null, 'fichier_sans_extension')).toBe('unsupported')
    })
    it('ignore les MIME inconnus', () => {
      expect(getPreviewKind('application/x-custom', 'fichier.xyz')).toBe('unsupported')
    })
  })

  describe('Edge cases', () => {
    it('priorité au MIME PDF sur l\'extension', () => {
      expect(getPreviewKind('application/pdf', 'document.unknown')).toBe('pdf')
    })
    it('extension est insensible à la casse', () => {
      expect(getPreviewKind(null, 'photo.JPG')).toBe('image')
      expect(getPreviewKind(null, 'clip.MP4')).toBe('video')
    })
    it('point final sans extension → unsupported', () => {
      expect(getPreviewKind(null, 'fichier.')).toBe('unsupported')
    })
  })
})

describe('isTooLargeToPreview', () => {
  it('retourne false si taille null/undefined', () => {
    expect(isTooLargeToPreview(null)).toBe(false)
    expect(isTooLargeToPreview(undefined)).toBe(false)
  })
  it('retourne false si taille = 0', () => {
    expect(isTooLargeToPreview(0)).toBe(false)
  })
  it('retourne false si taille < 50 MB', () => {
    expect(isTooLargeToPreview(PREVIEW_MAX_BYTES - 1)).toBe(false)
    expect(isTooLargeToPreview(10 * 1024 * 1024)).toBe(false)
  })
  it('retourne false si taille = exactement 50 MB', () => {
    expect(isTooLargeToPreview(PREVIEW_MAX_BYTES)).toBe(false)
  })
  it('retourne true si taille > 50 MB', () => {
    expect(isTooLargeToPreview(PREVIEW_MAX_BYTES + 1)).toBe(true)
    expect(isTooLargeToPreview(100 * 1024 * 1024)).toBe(true)
  })
})
