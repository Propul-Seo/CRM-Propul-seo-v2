import { v2 } from '../lib/supabase'
import type { ProjectStatusV2 } from '../types/project-v2'

const AUTOMATION_RULES: Array<{
  from: ProjectStatusV2 | '*'
  to: ProjectStatusV2
  tasks: Array<{ title: string; phase: string; priority: 'low' | 'medium' | 'high' }>
  journal: Array<{ content: string }>
}> = [
  {
    from: 'brief_received', to: 'quote_sent',
    tasks: [{ title: 'Envoyer le devis', phase: 'onboarding', priority: 'high' }],
    journal: [],
  },
  {
    from: 'quote_sent', to: 'in_progress',
    tasks: [{ title: 'Kick-off planifié', phase: 'onboarding', priority: 'high' }],
    journal: [{ content: 'Projet démarré' }],
  },
  {
    from: 'in_progress', to: 'review',
    tasks: [{ title: 'Envoyer livrable pour recette', phase: 'recette', priority: 'high' }],
    journal: [],
  },
  {
    from: 'review', to: 'delivered',
    tasks: [{ title: 'Demander validation écrite', phase: 'post_livraison', priority: 'high' }],
    journal: [{ content: 'Livraison effectuée' }],
  },
  {
    from: 'delivered', to: 'closed',
    tasks: [{ title: "Vérifier l'encaissement", phase: 'post_livraison', priority: 'high' }],
    journal: [{ content: 'Projet clôturé' }],
  },
  {
    from: '*', to: 'on_hold',
    tasks: [],
    journal: [{ content: 'Projet mis en pause' }],
  },
]

export async function triggerStatusAutomations(
  projectId: string,
  fromStatus: ProjectStatusV2,
  toStatus: ProjectStatusV2,
): Promise<void> {
  const matchingRules = AUTOMATION_RULES.filter(
    r => (r.from === fromStatus || r.from === '*') && r.to === toStatus,
  )
  if (matchingRules.length === 0) return

  const actionsExecuted: unknown[] = []

  for (const rule of matchingRules) {
    for (const task of rule.tasks) {
      const { error: taskErr } = await v2.from('checklist_items').insert({
        project_id: projectId,
        title: task.title,
        phase: task.phase,
        status: 'todo',
        priority: task.priority,
        parent_task_id: null,
        position: 9999,
      })
      if (taskErr) console.error('[automation] checklist insert failed:', taskErr.message)
      actionsExecuted.push({ type: 'checklist_task', title: task.title })
    }

    for (const entry of rule.journal) {
      const { error: actErr } = await v2.from('project_activities').insert({
        project_id: projectId,
        type: 'status',
        title: entry.content,
        is_auto: true,
        metadata: {
          automation: 'status_change',
          from: fromStatus,
          to: toStatus,
        },
      })
      if (actErr) console.error('[automation] activity insert failed:', actErr.message)
      actionsExecuted.push({ type: 'journal_entry', content: entry.content })
    }
  }

  await v2.from('automation_logs').insert({
    project_id: projectId,
    trigger_type: 'status_change',
    from_value: fromStatus,
    to_value: toStatus,
    actions_executed: actionsExecuted,
  })
}
