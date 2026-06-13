import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  auth_user_id: string;
  avatar_url?: string;
  phone?: string;
  position?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  is_active?: boolean;
  last_login?: string;
  team_id?: string;
  manager_id?: string;
  permissions?: Record<string, unknown>;
  notification_settings?: Record<string, unknown>;
  // Permissions individuelles
  can_view_dashboard?: boolean;
  can_view_leads?: boolean;
  can_view_projects?: boolean;
  can_view_tasks?: boolean;
  can_view_chat?: boolean;
  can_view_communication?: boolean;
  can_view_finance?: boolean;
  can_view_settings?: boolean;
  can_view_crm_bot_one?: boolean;
  can_view_crm_erp?: boolean;
  can_edit_leads?: boolean;
  // Index signature pour accès dynamique aux permissions
  [key: string]: unknown;
  created_at: string;
  updated_at: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recuperer tous les utilisateurs depuis la table users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.debug('Recuperation des utilisateurs...', 'useUsers');

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        logger.error('Erreur recuperation utilisateurs', 'useUsers', { code: fetchError.code });
        throw fetchError;
      }

      logger.debug('Utilisateurs recuperes', 'useUsers', { count: data?.length || 0 });
      setUsers(data || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur recuperation utilisateurs', 'useUsers', { error: errorMessage });
      setError(errorMessage);
      toast.error(`Erreur lors de la recuperation des utilisateurs: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recuperer un utilisateur par son auth_user_id
  const getUserByAuthId = useCallback(async (authUserId: string): Promise<User | null> => {
    try {
      logger.debug('Recherche utilisateur par auth_user_id', 'useUsers', { authUserId });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) {
        logger.debug('Utilisateur non trouve', 'useUsers', { authUserId });
        return null;
      }

      logger.debug('Utilisateur trouve', 'useUsers', { userId: data.id });
      return data;

    } catch (err) {
      logger.exception(err as Error, 'useUsers');
      return null;
    }
  }, []);

  // Mettre a jour un utilisateur
  const updateUser = useCallback(async (userId: string, updates: Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> => {
    try {
      logger.debug('Mise a jour utilisateur', 'useUsers', { userId });

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Erreur mise a jour utilisateur', 'useUsers', { userId, code: error.code });
        throw error;
      }

      logger.info('Utilisateur mis a jour', 'useUsers', { userId });

      // Mettre a jour l'etat local
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, ...updates } : user));

      return { success: true, data };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur mise a jour', 'useUsers', { userId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Creer un nouvel utilisateur
  const createUser = useCallback(async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: User; error?: string }> => {
    try {
      logger.debug('Creation utilisateur', 'useUsers');

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        logger.error('Erreur creation utilisateur', 'useUsers', { code: error.code });
        throw error;
      }

      logger.info('Utilisateur cree', 'useUsers', { userId: data.id });

      // Mettre a jour l'etat local
      setUsers(prev => [data, ...prev]);

      return { success: true, data };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur creation', 'useUsers', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Supprimer un utilisateur
  const deleteUser = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.debug('Suppression utilisateur', 'useUsers', { userId });

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        logger.error('Erreur suppression utilisateur', 'useUsers', { userId, code: error.code, message: error.message, details: error.details, hint: error.hint });
        // Retourner l'erreur complete avec details
        const fullError = error.message || error.details || `Code erreur: ${error.code}`;
        return { success: false, error: fullError };
      }

      logger.info('Utilisateur supprime', 'useUsers', { userId });

      // Mettre a jour l'etat local
      setUsers(prev => prev.filter(user => user.id !== userId));

      return { success: true };

    } catch (err: unknown) {
      const supabaseError = err as { message?: string; code?: string; details?: string };
      const errorMessage = supabaseError.message || supabaseError.details || 'Erreur inconnue';
      logger.error('Erreur suppression', 'useUsers', { userId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const activeUsers = useMemo(
    () => users.filter((u) => u.is_active !== false),
    [users]
  );

  return {
    users,
    activeUsers,
    loading,
    error,
    fetchUsers,
    getUserByAuthId,
    updateUser,
    createUser,
    deleteUser
  };
}
