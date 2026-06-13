import { motion } from 'framer-motion';
import { Archive } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArchiveManager } from './components/ArchiveManager';
import { TeamManager } from './components/TeamManager';
import { SettingsHeader } from './components/SettingsHeader';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { PreferencesCard } from './components/PreferencesCard';
import { SecurityCard } from './components/SecurityCard';
import { AdvancedEditor } from './components/AdvancedEditor';
import { UsersOverview } from './components/UsersOverview';
import { PasswordModal } from './components/PasswordModal';
import { OwnPasswordModal } from './components/OwnPasswordModal';
import { DeleteUserModal } from './components/DeleteUserModal';
import { SocialConnectionsCard } from './components/SocialConnectionsCard';
import { useSettingsProfile } from './hooks/useSettingsProfile';
import { useSettingsAdmin } from './hooks/useSettingsAdmin';

export function Settings() {
  const { currentUser } = useStore();
  const profile = useSettingsProfile();
  const admin = useSettingsAdmin({
    users: profile.users,
    fetchUsers: profile.fetchUsers,
    deleteUser: profile.deleteUser,
    isAdmin: profile.isAdmin,
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder aux paramètres</p>
        </div>
      </div>
    );
  }

  if (profile.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <SettingsHeader
        isLoading={profile.isLoading}
        isSaving={profile.isSaving}
        showAdvanced={profile.showAdvanced}
        currentUserData={profile.currentUserData}
        onRefresh={() => { profile.loadCurrentUserData(); profile.fetchUsers(); }}
        onSave={profile.saveUserData}
        onToggleAdvanced={() => profile.setShowAdvanced(!profile.showAdvanced)}
      />

      {!profile.showAdvanced && profile.currentUserData && (
        <>
          <ProfileInfoCard currentUserData={profile.currentUserData} updateField={profile.updateField} />
          <PreferencesCard currentUserData={profile.currentUserData} updateField={profile.updateField} />
          {profile.isAdmin && (
            <SecurityCard onChangePassword={() => admin.setShowOwnPasswordModal(true)} />
          )}
          <SocialConnectionsCard />
        </>
      )}

      {profile.showAdvanced && profile.currentUserData && (
        <>
          <AdvancedEditor currentUserData={profile.currentUserData} updateField={profile.updateField} />
          <UsersOverview
            users={profile.users}
            currentUserData={profile.currentUserData}
            isAdmin={profile.isAdmin}
            updatingPermissions={admin.updatingPermissions}
            onUpdatePermission={admin.updateUserPermission}
            onOpenPasswordModal={admin.openPasswordModal}
            onOpenDeleteModal={admin.openDeleteModal}
          />
        </>
      )}

      {profile.isAdmin && (
        <TeamManager users={profile.users} onRefresh={profile.fetchUsers} loading={profile.loading} />
      )}

      {profile.isAdmin && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Archive className="h-5 w-5" />
                <span>Gestion des Archives</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ArchiveManager />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {profile.error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border border-red-800 rounded-lg p-4"
        >
          <p className="text-red-300">Erreur: {profile.error}</p>
        </motion.div>
      )}

      {admin.passwordModal && (
        <PasswordModal
          passwordModal={admin.passwordModal}
          newPassword={admin.newPassword}
          setNewPassword={admin.setNewPassword}
          confirmPassword={admin.confirmPassword}
          setConfirmPassword={admin.setConfirmPassword}
          isUpdatingPassword={admin.isUpdatingPassword}
          onClose={admin.closePasswordModal}
          onSubmit={admin.updateUserPassword}
        />
      )}

      {admin.showOwnPasswordModal && (
        <OwnPasswordModal
          currentUserEmail={currentUser?.email || ''}
          ownNewPassword={admin.ownNewPassword}
          setOwnNewPassword={admin.setOwnNewPassword}
          ownConfirmPassword={admin.ownConfirmPassword}
          setOwnConfirmPassword={admin.setOwnConfirmPassword}
          isUpdatingOwnPassword={admin.isUpdatingOwnPassword}
          onClose={admin.closeOwnPasswordModal}
          onSubmit={admin.updateOwnPassword}
        />
      )}

      {admin.deleteModal && (
        <DeleteUserModal
          deleteModal={admin.deleteModal}
          isDeleting={admin.isDeleting}
          onClose={admin.closeDeleteModal}
          onConfirm={admin.handleDeleteUser}
        />
      )}
    </div>
  );
}
