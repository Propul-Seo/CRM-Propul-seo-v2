import { useState, useEffect } from 'react'
import { v2 } from '../../../lib/supabase'
import type { KpiOverview, KpiMonthly } from '../../../types/project-v2'

interface UseKpiV2Return {
  overview: KpiOverview | null
  monthly: KpiMonthly[]
  loading: boolean
  refetch: () => void
}

export function useKpiV2(): UseKpiV2Return {
  const [overview, setOverview] = useState<KpiOverview | null>(null)
  const [monthly, setMonthly] = useState<KpiMonthly[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      v2.from('kpi_overview').select('*').single(),
      v2.from('kpi_monthly').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    ]).then(([overviewRes, monthlyRes]) => {
      if (!overviewRes.error && overviewRes.data) setOverview(overviewRes.data as KpiOverview)
      if (!monthlyRes.error && monthlyRes.data) setMonthly(monthlyRes.data as KpiMonthly[])
      setLoading(false)
    })
  }, [tick])

  const refetch = () => setTick(t => t + 1)

  return { overview, monthly, loading, refetch }
}
