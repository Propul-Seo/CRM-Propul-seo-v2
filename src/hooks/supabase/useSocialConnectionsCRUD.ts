import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useSocialConnectionsCRUD() {
  const [loading, setLoading] = useState(false);

  const disconnectPlatform = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('social_connections').delete().eq('id', id);
      if (error) throw error;
      toast.success('Connexion supprimée');
      return { success: true };
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const syncMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-social-metrics');
      if (error) throw error;
      const synced = data?.synced || 0;
      toast.success(`${synced} post(s) synchronisé(s)`);
      return { success: true, data };
    } catch (error) {
      toast.error('Erreur de synchronisation');
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = async (platform: 'linkedin' | 'instagram') => {
    setLoading(true);
    try {
      const functionName = platform === 'linkedin' ? 'linkedin-oauth' : 'instagram-oauth';
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}?action=authorize`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.data?.url) {
        window.open(data.data.url, '_blank', 'width=600,height=700');
      }
      return { success: true, data };
    } catch (error) {
      toast.error(`Erreur de connexion ${platform}`);
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (platform: 'linkedin' | 'instagram', code: string) => {
    setLoading(true);
    try {
      const functionName = platform === 'linkedin' ? 'linkedin-oauth' : 'instagram-oauth';
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}?action=callback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ code }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`${platform === 'linkedin' ? 'LinkedIn' : 'Instagram'} connecté avec succès`);
      return { success: true, data };
    } catch (error) {
      toast.error(`Erreur de connexion ${platform}`);
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  return { disconnectPlatform, syncMetrics, initiateOAuth, handleOAuthCallback, loading };
}
