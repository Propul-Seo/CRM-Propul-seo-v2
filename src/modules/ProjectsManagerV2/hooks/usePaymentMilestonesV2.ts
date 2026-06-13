import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { PaymentMilestone, MilestoneStatus } from '../../../types/project-v2'

interface UsePaymentMilestonesV2Return {
  milestones: PaymentMilestone[]
  loading: boolean
  totalPercentage: number
  addMilestone: (data: Omit<PaymentMilestone, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateMilestone: (id: string, updates: Partial<PaymentMilestone>) => Promise<void>
  deleteMilestone: (id: string) => Promise<void>
  setMilestoneStatus: (id: string, status: MilestoneStatus) => Promise<void>
}

export function usePaymentMilestonesV2(projectId: string): UsePaymentMilestonesV2Return {
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    v2
      .from('payment_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setMilestones(data as PaymentMilestone[])
        setLoading(false)
      })
  }, [projectId])

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)

  const addMilestone = useCallback(async (data: Omit<PaymentMilestone, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: created, error } = await v2
      .from('payment_milestones')
      .insert({ ...data, project_id: projectId })
      .select()
      .single()
    if (!error && created) setMilestones(prev => [...prev, created as PaymentMilestone])
  }, [projectId])

  const updateMilestone = useCallback(async (id: string, updates: Partial<PaymentMilestone>) => {
    const { data, error } = await v2
      .from('payment_milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setMilestones(prev => prev.map(m => m.id === id ? data as PaymentMilestone : m))
  }, [])

  const deleteMilestone = useCallback(async (id: string) => {
    const { error } = await v2.from('payment_milestones').delete().eq('id', id)
    if (!error) setMilestones(prev => prev.filter(m => m.id !== id))
  }, [])

  const setMilestoneStatus = useCallback(async (id: string, status: MilestoneStatus) => {
    await updateMilestone(id, { status })
  }, [updateMilestone])

  return { milestones, loading, totalPercentage, addMilestone, updateMilestone, deleteMilestone, setMilestoneStatus }
}
