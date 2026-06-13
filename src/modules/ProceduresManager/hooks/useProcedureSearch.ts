import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Procedure } from '../types'

/**
 * Recherche full-text débouncée sur les procédures via la RPC search_procedures.
 * Retourne null si pas de query (→ laisser le caller afficher la liste normale).
 */
export function useProcedureSearch(query: string, debounceMs = 250) {
  const [results, setResults] = useState<Procedure[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_procedures', { q: trimmed })
      if (cancelled) return
      if (error) {
        setResults([])
      } else {
        setResults((data as unknown as Procedure[]) ?? [])
      }
      setLoading(false)
    }, debounceMs)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query, debounceMs])

  return { results, loading }
}
