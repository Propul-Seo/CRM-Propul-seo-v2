import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProcedureCategory } from '../types'
import { slugify } from '../lib/slugify'

export function useProcedureCategories() {
  const [categories, setCategories] = useState<ProcedureCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('procedure_categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) {
      setError(error.message)
      setCategories([])
    } else {
      setCategories((data as unknown as ProcedureCategory[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (input: { name: string; icon?: string; color?: string }): Promise<ProcedureCategory | null> => {
      const base = slugify(input.name)
      const slug = `${base}-${Math.random().toString(36).slice(2, 5)}`
      const sortOrder =
        categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 10 : 10
      const { data, error } = await supabase
        .from('procedure_categories')
        .insert({
          name: input.name,
          slug,
          icon: input.icon ?? null,
          color: input.color ?? null,
          sort_order: sortOrder,
        })
        .select('*')
        .single()
      if (error || !data) {
        setError(error?.message ?? 'Erreur création catégorie')
        return null
      }
      await load()
      return data as unknown as ProcedureCategory
    },
    [categories, load]
  )

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('procedure_categories').delete().eq('id', id)
      if (error) {
        setError(error.message)
        return false
      }
      await load()
      return true
    },
    [load]
  )

  return { categories, loading, error, reload: load, create, remove }
}
