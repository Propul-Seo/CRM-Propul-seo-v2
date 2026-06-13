import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Procedure, TipTapDoc } from '../types'
import { extractPlainText } from '../lib/extract-text'
import { slugify } from '../lib/slugify'
import { serializeImagesToPath } from '../lib/image-content'

export function useProcedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    if (error) {
      setError(error.message)
      setProcedures([])
    } else {
      setProcedures((data as unknown as Procedure[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const getById = useCallback(async (id: string): Promise<Procedure | null> => {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return data as unknown as Procedure
  }, [])

  const getBySlug = useCallback(async (slug: string): Promise<Procedure | null> => {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (error || !data) return null
    return data as unknown as Procedure
  }, [])

  const create = useCallback(
    async (input: {
      title: string
      summary?: string | null
      category_id?: string | null
      tags?: string[]
      content?: TipTapDoc
    }): Promise<Procedure | null> => {
      const rawContent = input.content ?? { type: 'doc', content: [] }
      const content = serializeImagesToPath(rawContent)
      const content_text = extractPlainText(content)
      const baseSlug = slugify(input.title)
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
      const { data: userRow } = await supabase.auth.getUser()
      const authUid = userRow.user?.id
      let authorId: string | null = null
      if (authUid) {
        const { data: u } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUid)
          .maybeSingle()
        authorId = (u?.id as string | undefined) ?? null
      }
      const { data, error } = await supabase
        .from('procedures')
        .insert({
          title: input.title,
          slug,
          summary: input.summary ?? null,
          category_id: input.category_id ?? null,
          tags: input.tags ?? [],
          content,
          content_text,
          author_id: authorId,
          updated_by: authorId,
        })
        .select('*')
        .single()
      if (error || !data) {
        setError(error?.message ?? 'Erreur création fiche')
        return null
      }
      await load()
      return data as unknown as Procedure
    },
    [load]
  )

  const update = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<Procedure, 'title' | 'summary' | 'category_id' | 'tags' | 'content' | 'is_pinned'>
      >
    ): Promise<Procedure | null> => {
      const patch: Record<string, unknown> = { ...updates }
      if (updates.content) {
        const serialized = serializeImagesToPath(updates.content)
        patch.content = serialized
        patch.content_text = extractPlainText(serialized)
      }
      const { data: userRow } = await supabase.auth.getUser()
      const authUid = userRow.user?.id
      if (authUid) {
        const { data: u } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUid)
          .maybeSingle()
        if (u?.id) patch.updated_by = u.id
      }
      const { data, error } = await supabase
        .from('procedures')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error || !data) {
        setError(error?.message ?? 'Erreur mise à jour')
        return null
      }
      await load()
      return data as unknown as Procedure
    },
    [load]
  )

  const togglePin = useCallback(
    async (id: string, is_pinned: boolean): Promise<boolean> => {
      const { error } = await supabase
        .from('procedures')
        .update({ is_pinned })
        .eq('id', id)
      if (error) {
        setError(error.message)
        return false
      }
      await load()
      return true
    },
    [load]
  )

  const archive = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('procedures')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) {
        setError(error.message)
        return false
      }
      await load()
      return true
    },
    [load]
  )

  return {
    procedures,
    loading,
    error,
    reload: load,
    getById,
    getBySlug,
    create,
    update,
    togglePin,
    archive,
  }
}
