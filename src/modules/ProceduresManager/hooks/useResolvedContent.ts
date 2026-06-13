import { useEffect, useState } from 'react'
import { resolveImagePaths } from '../lib/image-content'
import type { TipTapDoc } from '../types'

/**
 * Re-signe les paths Storage présents dans un document TipTap au render.
 * Tant que la résolution n'est pas terminée, renvoie le doc brut (les images
 * bases sur un path apparaîtront cassées — c'est le trade-off pour éviter
 * un flash de page vide).
 */
export function useResolvedContent(content: TipTapDoc): { resolved: TipTapDoc; loading: boolean } {
  const [resolved, setResolved] = useState<TipTapDoc>(content)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    resolveImagePaths(content).then((doc) => {
      if (cancelled) return
      setResolved(doc)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [content])

  return { resolved, loading }
}
