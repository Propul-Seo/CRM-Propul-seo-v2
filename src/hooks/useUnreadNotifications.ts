import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useUnreadNotifications = () => {
  const { user } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Calculer le total des messages non lus de tous les canaux
  const calculateTotalUnread = async () => {
    // Vérifier que l'utilisateur et son ID sont définis
    if (!user || !user.id) {
      logger.debug('❌ calculateTotalUnread: user ou user.id manquant');
      setTotalUnreadCount(0);
      return;
    }

    try {
      // Pour l'instant, on met le compteur à 0 pour éviter les erreurs
      // TODO: Implémenter une vraie logique de comptage plus tard
      setTotalUnreadCount(0);
      
    } catch (error) {
      logger.error('Erreur calcul total messages non lus:', error);
      setTotalUnreadCount(0);
    }
  };

  // Mettre à jour le total quand l'utilisateur change
  useEffect(() => {
    calculateTotalUnread();
  }, [user]);

  return {
    totalUnreadCount,
    calculateTotalUnread
  };
};
