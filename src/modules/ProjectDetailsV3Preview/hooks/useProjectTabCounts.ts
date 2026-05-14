// Compteurs légers pour les onglets V3. Une requête count par table.
import { useEffect, useState } from 'react'
import { supabase, v2 } from '@/lib/supabase'

interface TabCounts {
  activities: number
  tasks: number
  documents: number
  briefFilled: boolean
}

const EMPTY: TabCounts = { activities: 0, tasks: 0, documents: 0, briefFilled: false }

function isMockProject(projectId: string) {
  return projectId.startsWith('sw-') || projectId.startsWith('erp-') || projectId.startsWith('comm-')
}

export function useProjectTabCounts(projectId: string): TabCounts {
  const [counts, setCounts] = useState<TabCounts>(EMPTY)

  useEffect(() => {
    if (!projectId || isMockProject(projectId)) {
      setCounts(EMPTY)
      return
    }

    let cancelled = false

    Promise.all([
      v2.from('project_activities').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase
        .from('checklist_items_v2')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .neq('status', 'done'),
      v2.from('project_documents').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
      v2.from('project_briefs').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    ])
      .then(([acts, tasks, docs, brief]) => {
        if (cancelled) return
        setCounts({
          activities: acts.count ?? 0,
          tasks: tasks.count ?? 0,
          documents: docs.count ?? 0,
          briefFilled: (brief.count ?? 0) > 0,
        })
      })
      .catch((err) => {
        console.error('[useProjectTabCounts] failed', { projectId, err })
        if (!cancelled) setCounts(EMPTY)
      })

    return () => {
      cancelled = true
    }
  }, [projectId])

  return counts
}
