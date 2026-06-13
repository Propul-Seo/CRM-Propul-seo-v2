import { supabase } from '@/lib/supabase'

// SVG exclu volontairement : un SVG peut contenir du JS arbitraire et provoquer
// un XSS si l'URL signée est ouverte directement dans un onglet (Content-Type svg).
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX = 10 * 1024 * 1024 // 10 MB

export interface UploadedImage {
  /** Chemin Storage stocké durablement dans la fiche (ex: "drafts/abc.png"). */
  path: string
  /** URL signée temporaire (1h) pour affichage immédiat. */
  signedUrl: string
}

/**
 * Upload d'une image dans le bucket `procedure-assets`.
 * Retourne le path (à persister) et une URL signée (affichage immédiat).
 */
export async function uploadProcedureImage(
  file: File,
  procedureId: string | null
): Promise<UploadedImage> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Format non autorisé (png, jpg, webp, gif uniquement)')
  }
  if (file.size > MAX) {
    throw new Error('Image trop lourde (10 MB max)')
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  const folder = procedureId ?? 'drafts'
  const path = `${folder}/${id}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('procedure-assets')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (upErr) throw new Error(upErr.message)

  const { data, error } = await supabase.storage
    .from('procedure-assets')
    .createSignedUrl(path, 60 * 60) // 1h pour l'affichage immédiat dans l'éditeur
  if (error || !data) throw new Error(error?.message ?? 'Erreur URL signée')
  return { path, signedUrl: data.signedUrl }
}

/**
 * Re-signe un path Storage pour affichage frais (utilisé au render).
 */
export async function resignProcedurePath(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('procedure-assets')
    .createSignedUrl(path, 60 * 60)
  if (error || !data) return null
  return data.signedUrl
}
