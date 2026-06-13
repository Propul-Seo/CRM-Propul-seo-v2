import type { ChecklistItemV2 } from '@/types/project-v2'

const now = new Date().toISOString()

export const SITEWEB_CHECKLIST_TEMPLATE: Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  { parent_task_id: null, title: 'Brief client reçu', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 1 },
  { parent_task_id: null, title: 'Maquette créée', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 2 },
  { parent_task_id: null, title: 'Maquette validée client', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 3 },
  { parent_task_id: null, title: 'Développement', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 4 },
  { parent_task_id: null, title: 'SEO technique implémenté', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 5 },
  { parent_task_id: null, title: 'Contenu intégré', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 6 },
  { parent_task_id: null, title: 'Tests responsive & performance', phase: 'recette', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 7 },
  { parent_task_id: null, title: 'Mise en ligne', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 8 },
  { parent_task_id: null, title: 'Formation plateforme de modifications', phase: 'post_livraison', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 9 },
  { parent_task_id: null, title: 'Livraison finale + demande avis client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 10 },
]

export const MOCK_SITEWEB_CHECKLISTS: Record<string, ChecklistItemV2[]> = {
  'sw-001': [
    { id: 'swck-001a', project_id: 'sw-001', parent_task_id: null, title: 'Brief client reçu', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, position: 1, created_at: now, updated_at: now },
    { id: 'swck-001b', project_id: 'sw-001', parent_task_id: null, title: 'Maquette créée', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, position: 2, created_at: now, updated_at: now },
    { id: 'swck-001c', project_id: 'sw-001', parent_task_id: null, title: 'Maquette validée client', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, position: 3, created_at: now, updated_at: now },
    { id: 'swck-001d', project_id: 'sw-001', parent_task_id: null, title: 'Développement', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-alice', assigned_name: 'Alice Martin', due_date: null, position: 4, created_at: now, updated_at: now },
    { id: 'swck-001e', project_id: 'sw-001', parent_task_id: null, title: 'SEO technique implémenté', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 5, created_at: now, updated_at: now },
    { id: 'swck-001f', project_id: 'sw-001', parent_task_id: null, title: 'Contenu intégré', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 6, created_at: now, updated_at: now },
    { id: 'swck-001g', project_id: 'sw-001', parent_task_id: null, title: 'Tests responsive & performance', phase: 'recette', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 7, created_at: now, updated_at: now },
    { id: 'swck-001h', project_id: 'sw-001', parent_task_id: null, title: 'Mise en ligne', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 8, created_at: now, updated_at: now },
    { id: 'swck-001i', project_id: 'sw-001', parent_task_id: null, title: 'Formation plateforme de modifications', phase: 'post_livraison', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 9, created_at: now, updated_at: now },
    { id: 'swck-001j', project_id: 'sw-001', parent_task_id: null, title: 'Livraison finale + demande avis client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 10, created_at: now, updated_at: now },
  ],
  'sw-002': SITEWEB_CHECKLIST_TEMPLATE.map((t, i) => ({ ...t, id: `swck-002${String.fromCharCode(97+i)}`, project_id: 'sw-002', created_at: now, updated_at: now })),
  'sw-003': SITEWEB_CHECKLIST_TEMPLATE.map((t, i) => ({ ...t, id: `swck-003${String.fromCharCode(97+i)}`, project_id: 'sw-003', status: 'done' as const, created_at: now, updated_at: now })),
}
