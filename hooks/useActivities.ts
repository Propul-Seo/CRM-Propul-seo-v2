import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/types/activity';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('date_utc', { ascending: true });
      if (!ignore && data) setActivities(data as Activity[]);
      setLoading(false);
    }
    load();

    const sub = supabase
      .channel('activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, payload => {
        load();
      })
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(sub);
    };
  }, []);

  return { activities, loading };
} 