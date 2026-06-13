import { useEffect, useState } from 'react'

/**
 * Retourne une version « débouncée » de `value` : la valeur retournée ne se met
 * à jour qu'après `delay` ms sans changement. Utile pour les champs de recherche.
 */
export function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}
