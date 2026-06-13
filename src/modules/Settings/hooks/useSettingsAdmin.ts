import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import type { User as UserType } from '../../../hooks/useUsers';
import type { PasswordModalState, DeleteModalState } from '../types';

interface UseSettingsAdminParams {
  users: UserType[];
  fetchUsers: () => Promise<void>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  isAdmin: boolean;
}

export function useSettingsAdmin({ users, fetchUsers, deleteUser, isAdmin }: UseSettingsAdminParams) {
  const [updatingPermissions, setUpdatingPermissions] = useState<Set<string>>(new Set());
  const [passwordModal, setPasswordModal] = useState<PasswordModalState | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showOwnPasswordModal, setShowOwnPasswordModal] = useState(false);
  const [ownNewPassword, setOwnNewPassword] = useState('');
  const [ownConfirmPassword, setOwnConfirmPassword] = useState('');
  const [isUpdatingOwnPassword, setIsUpdatingOwnPassword] = useState(false);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateUserPermission = async (userId: string, permission: string, value: boolean) => {
    if (!isAdmin) {
      toast.error('Accès refusé - Administrateur uniquement');
      return;
    }

    const permissionKey = `${userId}-${permission}`;

    try {
      setUpdatingPermissions(prev => new Set(prev).add(permissionKey));

      const { error } = await (supabase
        .from('users') as any)
        .update({
          [`can_${permission}`]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      toast.success(`Permission ${permission} mise à jour avec succès`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    } finally {
      setUpdatingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(permissionKey);
        return newSet;
      });
    }
  };

  const updateUserPassword = async () => {
    if (!isAdmin || !passwordModal) {
      toast.error('Accès refusé - Administrateur uniquement');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const targetUser = users.find(u => u.id === passwordModal.userId);
      if (!targetUser?.auth_user_id) {
        throw new Error('Impossible de trouver l\'identifiant d\'authentification de l\'utilisateur');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) throw new Error('Session non valide');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            targetUserId: targetUser.auth_user_id,
            newPassword: newPassword
          })
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification du mot de passe');
      }

      toast.success(`Mot de passe modifié avec succès pour ${passwordModal.userEmail}`);
      setPasswordModal(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const openPasswordModal = (userId: string, userEmail: string) => {
    setPasswordModal({ isOpen: true, userId, userEmail });
    setNewPassword('');
    setConfirmPassword('');
  };

  const closePasswordModal = () => {
    setPasswordModal(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const updateOwnPassword = async () => {
    if (!ownNewPassword || ownNewPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (ownNewPassword !== ownConfirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsUpdatingOwnPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: ownNewPassword });
      if (error) throw error;

      toast.success('Mot de passe modifié ! Vous allez être déconnecté de toutes vos sessions...');

      setShowOwnPasswordModal(false);
      setOwnNewPassword('');
      setOwnConfirmPassword('');

      await new Promise(resolve => setTimeout(resolve, 1500));
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsUpdatingOwnPassword(false);
    }
  };

  const closeOwnPasswordModal = () => {
    setShowOwnPasswordModal(false);
    setOwnNewPassword('');
    setOwnConfirmPassword('');
  };

  const openDeleteModal = (userId: string, userName: string, userEmail: string) => {
    setDeleteModal({ isOpen: true, userId, userName, userEmail });
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const handleDeleteUser = async () => {
    if (!isAdmin || !deleteModal) {
      toast.error('Accès refusé - Administrateur uniquement');
      return;
    }

    setIsDeleting(true);

    try {
      const targetUser = users.find(u => u.id === deleteModal.userId);

      const cleanColumn = async (table: string, column: string) => {
        try {
          const { error } = await (supabase
            .from(table) as any)
            .update({ [column]: null })
            .eq(column, deleteModal.userId);
          if (error) {
            console.log(`${table}.${column}: ${error.message}`);
          }
        } catch {
          // Ignorer
        }
      };

      await cleanColumn('contacts', 'assigned_to');
      await cleanColumn('clients', 'assigned_to');
      await cleanColumn('leads', 'assigned_to');
      await cleanColumn('tasks', 'assigned_to');

      const result = await deleteUser(deleteModal.userId);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      if (targetUser?.auth_user_id) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          if (accessToken) {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ targetUserId: targetUser.auth_user_id })
              }
            );

            const authResult = await response.json();
            if (!authResult.success) {
              console.warn('Utilisateur supprimé de la table mais pas de Supabase Auth:', authResult.error);
            }
          }
        } catch (authError) {
          console.warn('Impossible de supprimer de Supabase Auth:', authError);
        }
      }

      toast.success(`L'utilisateur ${deleteModal.userName || deleteModal.userEmail} a été supprimé`);
      closeDeleteModal();
      await fetchUsers();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    updatingPermissions,
    passwordModal,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isUpdatingPassword,
    showOwnPasswordModal,
    setShowOwnPasswordModal,
    ownNewPassword,
    setOwnNewPassword,
    ownConfirmPassword,
    setOwnConfirmPassword,
    isUpdatingOwnPassword,
    deleteModal,
    isDeleting,
    updateUserPermission,
    updateUserPassword,
    openPasswordModal,
    closePasswordModal,
    updateOwnPassword,
    closeOwnPasswordModal,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteUser,
  };
}
