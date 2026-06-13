// Types spécifiques au module TaskManager

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
  assignedTo?: string;
} 