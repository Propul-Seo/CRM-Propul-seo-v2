export type PreviewKind = 'pdf' | 'image' | 'video' | 'office' | 'unsupported'

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v']
const OFFICE_EXT = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp']
const OFFICE_MIME_FRAGMENTS = [
  'officedocument',
  'msword',
  'ms-excel',
  'ms-powerpoint',
  'opendocument',
  'vnd.ms-',
]

export const PREVIEW_MAX_BYTES = 50 * 1024 * 1024 // 50 MB

function getExtension(name: string | null | undefined): string {
  if (!name) return ''
  const idx = name.lastIndexOf('.')
  if (idx < 0 || idx === name.length - 1) return ''
  return name.slice(idx + 1).toLowerCase()
}

export function getPreviewKind(
  mimeType: string | null | undefined,
  fileName: string | null | undefined,
): PreviewKind {
  const mime = (mimeType ?? '').toLowerCase()
  const ext = getExtension(fileName)

  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image'
  if (mime.startsWith('video/') || VIDEO_EXT.includes(ext)) return 'video'

  if (OFFICE_EXT.includes(ext)) return 'office'
  if (OFFICE_MIME_FRAGMENTS.some((frag) => mime.includes(frag))) return 'office'

  return 'unsupported'
}

export function isTooLargeToPreview(sizeBytes: number | null | undefined): boolean {
  if (sizeBytes == null) return false
  return sizeBytes > PREVIEW_MAX_BYTES
}
