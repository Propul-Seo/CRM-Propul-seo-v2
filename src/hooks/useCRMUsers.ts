import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  company?: string;
}

export function useCRMUsers() {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les utilisateurs depuis la table users
      // Important: On utilise la table users car c'est elle qui est référencée
      // par la clé étrangère assigned_to dans la table contacts
      const { data: usersFromTable, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role, is_active')
        .eq('is_active', true)
        .order('name');

      if (usersError) {
        logger.error('❌ Erreur récupération users:', usersError);
        setError('Erreur lors de la récupération des utilisateurs');
        toast.error('Erreur lors du chargement des utilisateurs');
        return;
      }

      if (usersFromTable && usersFromTable.length > 0) {
        const usersData: CRMUser[] = usersFromTable.map(user => ({
          id: user.id,
          name: user.name || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email || '',
          role: user.role
        }));

        setUsers(usersData);
        logger.debug('✅ Utilisateurs récupérés depuis table users:', usersData.length);
      } else {
        logger.debug('⚠️ Aucun utilisateur actif trouvé dans la table users');
        setUsers([]);
      }

    } catch (error) {
      logger.error('❌ Erreur useCRMUsers:', error);
      setError('Erreur lors du chargement des utilisateurs');
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const refetch = () => {
    fetchUsers();
  };

  return {
    users,
    loading,
    error,
    refetch
  };
} 