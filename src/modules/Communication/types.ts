import type { PostRow, PostStatus } from '../../types/supabase-types';

export type { PostRow, PostStatus };

export interface KanbanColumn {
  id: PostStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  posts: PostRow[];
}

export type ViewMode = 'kanban' | 'calendar' | 'dashboard';

export interface PostFormData {
  title: string;
  type: 'agence' | 'perso' | 'client' | 'informatif';
  platform: 'linkedin' | 'instagram' | 'newsletter' | 'multi';
  status: PostStatus;
  strategic_angle: string;
  hook: string;
  content: string;
  objective: string;
  scheduled_at: string;
  responsible_user_id: string;
  client_id: string;
  external_url: string;
}
