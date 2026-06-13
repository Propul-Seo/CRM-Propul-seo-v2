import type { ChecklistItemV2 } from '@/types/project-v2'

const now = new Date().toISOString()

export const ERP_CHECKLIST_TEMPLATE: Omit<ChecklistItemV2, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  { parent_task_id: null, title: 'Audit besoins client', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 1 },
  { parent_task_id: null, title: 'Cahier des charges rédigé', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 2 },
  { parent_task_id: null, title: 'CDC validé client', phase: 'onboarding', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 3 },
  { parent_task_id: null, title: 'Maquettes UX validées', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 4 },
  { parent_task_id: null, title: 'Base de données conçue', phase: 'conception', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 5 },
  { parent_task_id: null, title: 'Modules développés', phase: 'developpement', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 6 },
  { parent_task_id: null, title: 'Intégrations API configurées', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 7 },
  { parent_task_id: null, title: 'Tests & corrections', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 8 },
  { parent_task_id: null, title: 'Formation utilisateurs', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 9 },
  { parent_task_id: null, title: 'Déploiement production', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 10 },
  { parent_task_id: null, title: 'Recette signée client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 11 },
]

export const MOCK_ERP_CHECKLISTS: Record<string, ChecklistItemV2[]> = {
  'erp-001': [
    { id: 'erck-001a', project_id: 'erp-001', parent_task_id: null, title: 'Audit besoins client', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, position: 1, created_at: now, updated_at: now },
    { id: 'erck-001b', project_id: 'erp-001', parent_task_id: null, title: 'Cahier des charges rédigé', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, position: 2, created_at: now, updated_at: now },
    { id: 'erck-001c', project_id: 'erp-001', parent_task_id: null, title: 'CDC validé client', phase: 'onboarding', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, position: 3, created_at: now, updated_at: now },
    { id: 'erck-001d', project_id: 'erp-001', parent_task_id: null, title: 'Maquettes UX validées', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, position: 4, created_at: now, updated_at: now },
    { id: 'erck-001e', project_id: 'erp-001', parent_task_id: null, title: 'Base de données conçue', phase: 'conception', status: 'done', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, position: 5, created_at: now, updated_at: now },
    { id: 'erck-001f', project_id: 'erp-001', parent_task_id: null, title: 'Modules développés', phase: 'developpement', status: 'in_progress', priority: 'high', assigned_to: 'user-bob', assigned_name: 'Bob Lefèvre', due_date: null, position: 6, created_at: now, updated_at: now },
    { id: 'erck-001g', project_id: 'erp-001', parent_task_id: null, title: 'Intégrations API configurées', phase: 'developpement', status: 'todo', priority: 'medium', assigned_to: null, assigned_name: null, due_date: null, position: 7, created_at: now, updated_at: now },
    { id: 'erck-001h', project_id: 'erp-001', parent_task_id: null, title: 'Tests & corrections', phase: 'recette', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 8, created_at: now, updated_at: now },
    { id: 'erck-001i', project_id: 'erp-001', parent_task_id: null, title: 'Formation utilisateurs', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 9, created_at: now, updated_at: now },
    { id: 'erck-001j', project_id: 'erp-001', parent_task_id: null, title: 'Déploiement production', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 10, created_at: now, updated_at: now },
    { id: 'erck-001k', project_id: 'erp-001', parent_task_id: null, title: 'Recette signée client', phase: 'post_livraison', status: 'todo', priority: 'high', assigned_to: null, assigned_name: null, due_date: null, position: 11, created_at: now, updated_at: now },
  ],
  'erp-002': ERP_CHECKLIST_TEMPLATE.map((t, i) => ({ ...t, id: `erck-002${String.fromCharCode(97+i)}`, project_id: 'erp-002', created_at: now, updated_at: now })),
}
