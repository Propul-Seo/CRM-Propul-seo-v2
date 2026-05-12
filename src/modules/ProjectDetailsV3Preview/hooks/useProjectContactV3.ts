import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ProjectContact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
}

/**
 * Charge les coordonnées du contact lié au projet (table `contacts`).
 * Renvoie null si aucun contact n'est lié (contactId = null).
 */
export function useProjectContactV3(contactId: string | null | undefined) {
  const [contact, setContact] = useState<ProjectContact | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchContact = useCallback(async () => {
    if (!contactId) {
      setContact(null)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, email, phone, company')
      .eq('id', contactId)
      .maybeSingle()
    if (error) {
      console.error('[contact-fetch]', error)
      setContact(null)
    } else {
      setContact(data as ProjectContact | null)
    }
    setLoading(false)
  }, [contactId])

  useEffect(() => {
    fetchContact()
  }, [fetchContact])

  return { contact, loading, refetch: fetchContact }
}
