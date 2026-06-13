// src/modules/ProjectsManagerV2/hooks/useBriefInvitation.ts
import { useState, useEffect, useCallback } from 'react'
import { v2Anon } from '@/lib/supabase'

interface InvitationData {
  id: string
  token: string
  company_name: string | null
  status: 'pending' | 'submitted'
}

interface UseBriefInvitationReturn {
  data: InvitationData | null
  loading: boolean
  error: string | null
  submitInvitation: (companyName: string, fields: Record<string, string>) => Promise<boolean>
  alreadySubmitted: boolean
}

export function useBriefInvitation(token: string): UseBriefInvitationReturn {
  const [data, setData] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    setError(null)
    setData(null)
    setAlreadySubmitted(false)
    setLoading(true)

    v2Anon
      .from('brief_invitations')
      .select('id, token, company_name, status')
      .eq('short_code', token)
      .single()
      .then(({ data: inv, error: err }) => {
        if (err || !inv) {
          setError('Lien invalide ou expiré.')
        } else if (inv.status === 'submitted') {
          setAlreadySubmitted(true)
        } else {
          setData(inv as InvitationData)
        }
        setLoading(false)
      })
  }, [token])

  const submitInvitation = useCallback(async (
    companyName: string,
    fields: Record<string, string>
  ): Promise<boolean> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-project-from-brief`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ token, companyName, fields }),
        }
      )
      const json = await res.json()
      return json.ok === true
    } catch {
      return false
    }
  }, [token])

  return { data, loading, error, submitInvitation, alreadySubmitted }
}
