import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthorInfo {
  name: string | null
  avatarUrl: string | null
}

export function useProcedureAuthor(authorId: string | null): AuthorInfo {
  const [info, setInfo] = useState<AuthorInfo>({ name: null, avatarUrl: null })

  useEffect(() => {
    let cancelled = false
    if (!authorId) {
      setInfo({ name: null, avatarUrl: null })
      return
    }
    supabase
      .from('users')
      .select('name, avatar_url')
      .eq('id', authorId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return
        setInfo({ name: data.name ?? null, avatarUrl: data.avatar_url ?? null })
      })
    return () => {
      cancelled = true
    }
  }, [authorId])

  return info
}
