import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

let cache: Set<string> | null = null
const subscribers = new Set<(s: Set<string>) => void>()

async function refresh() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('is_active', true)
  if (error) {
    console.error('[useActiveUserIds] fetch failed:', error)
    return
  }
  cache = new Set((data ?? []).map((u: { id: string }) => u.id))
  subscribers.forEach((cb) => cb(cache!))
}

/**
 * Set partagé des IDs users actifs.
 * Permet aux composants d'affichage de masquer le nom d'un responsable désactivé
 * sans alourdir leurs signatures avec une prop dédiée.
 */
export function useActiveUserIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(cache ?? new Set())

  useEffect(() => {
    subscribers.add(setIds)
    if (!cache) refresh()
    return () => {
      subscribers.delete(setIds)
    }
  }, [])

  return ids
}
