import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../../store/useStore';
import { toast } from 'sonner';
import { useUsers, User as UserType } from '../../../hooks/useUsers';
import { useSearchParams } from 'react-router-dom';
import type { SettingsProfileReturn } from '../types';

export function useSettingsProfile(): SettingsProfileReturn {
  const { currentUser } = useStore();
  const { users, loading, error, fetchUsers, getUserByAuthId, updateUser, deleteUser } = useUsers();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const showAdvanced = searchParams.get('view') === 'advanced';
  const setShowAdvanced = useCallback((v: boolean) => {
    setSearchParams((prev) => {
      const np = new URLSearchParams(prev);
      if (v) np.set('view', 'advanced'); else np.delete('view');
      return np;
    }, { replace: true });
  }, [setSearchParams]);
  const [currentUserData, setCurrentUserData] = useState<UserType | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (currentUser?.id) {
      loadCurrentUserData();
    }
  }, [currentUser]);

  const loadCurrentUserData = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      const userData = await getUserByAuthId(currentUser.id);
      if (userData) {
        setCurrentUserData(userData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async () => {
    if (!currentUserData?.id) return;

    setIsSaving(true);
    try {
      const dataToUpdate = { ...currentUserData };

      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key as keyof UserType] === '' || dataToUpdate[key as keyof UserType] === null) {
          dataToUpdate[key as keyof UserType] = undefined;
        }
      });

      const result = await updateUser(currentUserData.id, dataToUpdate);

      if (result.success) {
        toast.success('Profil mis à jour avec succès');
        try {
          if (result.data) {
            setCurrentUserData(result.data);
          }
        } catch (updateError) {
          console.warn('Erreur lors de la mise à jour de l\'état local:', updateError);
        }
      } else {
        toast.error(`Erreur lors de la sauvegarde: ${result.error}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof UserType, value: UserType[keyof UserType]) => {
    if (!currentUserData) return;

    if (field === 'avatar_url' && value) {
      try {
        new URL(value as string);
      } catch {
        toast.warning('L\'URL de l\'avatar ne semble pas valide. Vérifiez le format.');
        return;
      }
    }

    setCurrentUserData(prev => prev ? { ...prev, [field]: value } : null);
  };

  return {
    currentUserData,
    isLoading,
    isSaving,
    showAdvanced,
    setShowAdvanced,
    loadCurrentUserData,
    saveUserData,
    updateField,
    users,
    loading,
    error,
    fetchUsers,
    deleteUser,
    isAdmin,
  };
}
