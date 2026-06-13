import { useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export interface TrackingResult {
  token: string
  pixelUrl: string
  pixelHtml: string
}

export function useEmailTracking(projectId: string) {
  const createTracking = useCallback(async (subject: string, recipientEmail?: string): Promise<TrackingResult | null> => {
    const { data, error } = await supabase
      .from('email_tracking')
      .insert({ project_id: projectId, subject, recipient_email: recipientEmail ?? null })
      .select()
      .single()

    if (error || !data) return null

    const pixelUrl  = `${SUPABASE_URL}/functions/v1/track-open?t=${data.token}`
    const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`

    return { token: data.token, pixelUrl, pixelHtml }
  }, [projectId])

  const getTrackingStatus = useCallback(async (token: string) => {
    const { data } = await supabase
      .from('email_tracking')
      .select('opened_at, open_count')
      .eq('token', token)
      .maybeSingle()
    return data
  }, [])

  return { createTracking, getTrackingStatus }
}
