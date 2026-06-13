import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Vérifie si l'utilisateur courant peut supprimer/modifier en V3.
// La source de vérité côté sécurité reste la RLS Postgres — ce hook ne sert
// qu'à cacher les boutons inutiles côté UI.
export function useIsProjectV3Admin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const { data: userRow } = await supabase.auth.getUser()
      const authUid = userRow.user?.id
      if (!authUid) {
        if (!cancelled) {
          setIsAdmin(false)
          setLoading(false)
        }
        return
      }
      const { data } = await supabase
        .from('users')
        .select('role, email')
        .eq('auth_user_id', authUid)
        .maybeSingle()
      if (cancelled) return
      const admin = data?.role === 'admin' || data?.email === 'team@propulseo-site.com'
      setIsAdmin(!!admin)
      setLoading(false)
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  return { isAdmin, loading }
}
