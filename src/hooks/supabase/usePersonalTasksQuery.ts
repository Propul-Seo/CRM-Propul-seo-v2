import { useSupabaseData } from './useSupabaseQuery';
import type { PersonalTask } from '../../types/personalTasks';

export function usePersonalTasks() {
  return useSupabaseData<PersonalTask>({
    table: 'personal_tasks',
    select: '*',
    filters: { status: undefined },
    orderBy: { column: 'created_at', ascending: false }
  });
}
