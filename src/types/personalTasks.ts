export type PersonalTaskStatus = 'backlog' | 'todo' | 'in_progress' | 'weekend' | 'done' | 'archived';
export type PersonalTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PersonalTask {
  id: string;
  title: string;
  description: string | null;
  status: PersonalTaskStatus;
  priority: PersonalTaskPriority;
  tags: string[];
  deadline: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PersonalTaskInsert = Omit<PersonalTask, 'id' | 'created_at' | 'updated_at'>;
export type PersonalTaskUpdate = Partial<Omit<PersonalTask, 'id' | 'created_at'>>;
