import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

export interface CurrentUserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar_url?: string;
}

export function useCurrentUser() {
  const [currentUserData, setCurrentUserData] = useState<CurrentUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Synchroniser avec le store pour éviter les conflits
  const { currentUser, setCurrentUser } = useStore();

  const loadCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuellement connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        setLoading(false);
        return;
      }

      logger.debug('🔍 Utilisateur connecté:', user.email);

      // Récupérer les données depuis la table users uniquement
      let userData: CurrentUserData | null = null;
      
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (!usersError && usersData) {
          userData = {
            id: usersData.id,
            email: usersData.email || user.email || '',
            name: usersData.name,
            role: usersData.role,
            avatar_url: usersData.avatar_url
          };
          logger.debug('✅ Données trouvées dans users:', userData);
          
          // Synchroniser avec le store
          if (setCurrentUser) {
            setCurrentUser({
              id: user.id,
              email: user.email || '',
              name: usersData.name,
              role: usersData.role || 'user'
            });
          }
        } else {
          logger.debug('⚠️ Erreur récupération users:', usersError);
        }
      } catch (usersError) {
        logger.debug('⚠️ Exception lors de la récupération users:', usersError);
      }

      // Si toujours pas de données, utiliser les données de base de auth.users
      if (!userData) {
        userData = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
          role: user.user_metadata?.role || 'user',
          avatar_url: user.user_metadata?.avatar_url
        };
        logger.debug('✅ Utilisation des données de base auth.users:', userData);
      }

      setCurrentUserData(userData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('❌ Erreur lors du chargement de l\'utilisateur:', errorMessage);
      setError(errorMessage);
      
      // Fallback avec les données de base
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserData({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
          role: user.user_metadata?.role || 'user'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [setCurrentUser]);

  // Mettre à jour le nom de l'utilisateur
  const updateUserName = useCallback(async (newName: string) => {
    if (!currentUserData) return false;

    try {
      logger.debug('🔄 Mise à jour du nom utilisateur:', newName);

      const { error } = await supabase
        .from('users')
        .update({ name: newName })
        .eq('id', currentUserData.id);

      if (error) {
        logger.error('❌ Erreur mise à jour nom:', error);
        throw error;
      }

      // Mettre à jour l'état local
      setCurrentUserData(prev => prev ? { ...prev, name: newName } : null);
      
      // Synchroniser avec le store
      if (setCurrentUser && currentUser) {
        setCurrentUser({
          ...currentUser,
          name: newName
        });
      }
      
      logger.debug('✅ Nom utilisateur mis à jour avec succès');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('❌ Erreur lors de la mise à jour du nom:', errorMessage);
      return false;
    }
  }, [currentUserData, currentUser, setCurrentUser]);

  // Écouter les changements de la table users en temps réel
  useEffect(() => {
    if (!currentUserData?.id) return;

    logger.debug('🔊 Écoute des changements pour l\'utilisateur:', currentUserData.id);

    const channel = supabase
      .channel(`user-${currentUserData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${currentUserData.id}`
        },
        (payload) => {
          logger.debug('🔄 Changement détecté dans users:', payload);
          const newData = payload.new as any;
          
          setCurrentUserData(prev => prev ? {
            ...prev,
            name: newData.name,
            email: newData.email,
            role: newData.role,
            avatar_url: newData.avatar_url
          } : null);

          // Synchroniser avec le store
          if (setCurrentUser && currentUser) {
            setCurrentUser({
              ...currentUser,
              name: newData.name,
              role: newData.role
            });
          }
        }
      )
      .subscribe();

    return () => {
      logger.debug('🔇 Désabonnement du canal utilisateur');
      supabase.removeChannel(channel);
    };
  }, [currentUserData?.id, currentUser, setCurrentUser]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  return {
    currentUserData,
    loading,
    error,
    updateUserName,
    refetch: loadCurrentUser
  };
}
