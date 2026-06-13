import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProcedureRevision } from '../types'

export function useProcedureRevisions(procedureId: string | null) {
  const [revisions, setRevisions] = useState<ProcedureRevision[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!procedureId) {
      setRevisions([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('procedure_revisions')
      .select('*')
      .eq('procedure_id', procedureId)
      .order('edited_at', { ascending: false })
    setRevisions((data as unknown as ProcedureRevision[]) ?? [])
    setLoading(false)
  }, [procedureId])

  useEffect(() => {
    load()
  }, [load])

  return { revisions, loading, reload: load }
}
