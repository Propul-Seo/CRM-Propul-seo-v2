import { useMemo } from 'react'
import type { CompletionData } from '../../../types/project-v2'

const WEIGHTS = {
  checklist: 0.60,
  brief: 0.10,
  accesses: 0.10,
  timeline: 0.10,
  budget: 0.10,
}

export function useCompletionScore(data: CompletionData): number {
  return useMemo(() => {
    const checklistScore =
      data.checklistTotal > 0
        ? (data.checklistDone / data.checklistTotal) * 100
        : 0

    const briefScore = data.hasBrief ? 100 : 0

    const accessScore =
      data.totalAccesses > 0
        ? (data.activeAccesses / data.totalAccesses) * 100
        : 0

    const timelineScore = data.timelineEntries >= 3 ? 100 : (data.timelineEntries / 3) * 100

    const budgetScore = data.hasBudget ? 100 : 0

    const total =
      checklistScore * WEIGHTS.checklist +
      briefScore * WEIGHTS.brief +
      accessScore * WEIGHTS.accesses +
      timelineScore * WEIGHTS.timeline +
      budgetScore * WEIGHTS.budget

    return Math.round(total)
  }, [data])
}

// Version simplifiée pour le Kanban (sprint 1 : checklist only)
export function useSimpleCompletionScore(checklistDone: number, checklistTotal: number): number {
  return useMemo(() => {
    if (checklistTotal === 0) return 0
    return Math.round((checklistDone / checklistTotal) * 100)
  }, [checklistDone, checklistTotal])
}
