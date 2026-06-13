import { useState, useEffect } from 'react'
import { v2 } from '../../../lib/supabase'
import type { AuditLog } from '../../../types/project-v2'

interface UseAuditLogsV2Return {
  logs: AuditLog[]
  loading: boolean
  refetch: () => void
}

export function useAuditLogsV2(projectId: string, limit = 50): UseAuditLogsV2Return {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('audit_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (!error && data) setLogs(data as AuditLog[])
        setLoading(false)
      })
  }, [projectId, limit, tick])

  const refetch = () => setTick(t => t + 1)

  return { logs, loading, refetch }
}
