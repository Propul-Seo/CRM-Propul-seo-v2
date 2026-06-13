import { supabase } from '@/lib/supabase';
import { Activity } from '@/types/activity';

export async function fetchActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('date_utc', { ascending: true });
  if (error) throw error;
  return data as Activity[];
}

export async function addActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('activities')
    .insert([activity])
    .select()
    .single();
  if (error) throw error;
  return data as Activity;
} 