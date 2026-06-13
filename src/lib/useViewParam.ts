import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Hook utilitaire pour binder un état "vue" sur un searchParam URL.
 *
 * - Quand value === defaultValue, le param est retiré de l'URL (URL propre).
 * - Sinon, le param est écrit en `?<name>=<value>`.
 * - Lecture : si le param est absent ou pas dans `allowedValues`, retourne `defaultValue`.
 * - Écriture : `replace: true` → pas d'historique browser pollué pour les toggles.
 *
 * Usage :
 * ```ts
 * const [view, setView] = useViewParam('view', 'pipeline', ['pipeline','project','month','week'] as const)
 * ```
 */
export function useViewParam<T extends string>(
  paramName: string,
  defaultValue: T,
  allowedValues: readonly T[],
): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get(paramName)
  const current: T =
    raw && (allowedValues as readonly string[]).includes(raw) ? (raw as T) : defaultValue

  const setView = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const np = new URLSearchParams(prev)
          if (next === defaultValue) np.delete(paramName)
          else np.set(paramName, next)
          return np
        },
        { replace: true },
      )
    },
    [paramName, defaultValue, setSearchParams],
  )

  return [current, setView]
}
