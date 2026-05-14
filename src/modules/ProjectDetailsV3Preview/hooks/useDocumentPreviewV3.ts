import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { BUCKET, type Doc } from '../tabs/documents/constants'
import type { PreviewDocument } from '../components/DocumentPreviewModal'

const SIGNED_URL_TTL_SECONDS = 600

export function useDocumentPreviewV3() {
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const openPreview = async (doc: Doc) => {
    if (!doc.file_path) {
      toast.info('Fichier non disponible')
      return
    }
    setPreviewDoc({
      name: doc.name,
      mime_type: doc.mime_type,
      file_path: doc.file_path,
      file_size: doc.file_size,
    })
    setPreviewUrl(null)
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS)
    if (error || !data?.signedUrl) {
      toast.error('Erreur génération lien d’aperçu')
      setPreviewDoc(null)
      return
    }
    setPreviewUrl(data.signedUrl)
  }

  const closePreview = () => {
    setPreviewDoc(null)
    setPreviewUrl(null)
  }

  return { previewDoc, previewUrl, openPreview, closePreview }
}
