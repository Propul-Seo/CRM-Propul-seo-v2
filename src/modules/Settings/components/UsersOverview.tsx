import { motion } from 'framer-motion';
import { Eye, User, Shield, Key, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { ALL_PERMISSIONS } from '../../../config/modulePermissions';
import type { UserType } from '../types';

interface UsersOverviewProps {
  users: UserType[];
  currentUserData: UserType | null;
  isAdmin: boolean;
  updatingPermissions: Set<string>;
  onUpdatePermission: (userId: string, permission: string, value: boolean) => void;
  onOpenPasswordModal: (userId: string, userEmail: string) => void;
  onOpenDeleteModal: (userId: string, userName: string, userEmail: string) => void;
}

function PermissionField({
  userId, permission, label, currentValue, isUpdating, onUpdate
}: {
  userId: string; permission: string; label: string; currentValue: boolean;
  isUpdating: boolean; onUpdate: (userId: string, permission: string, value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <select
        value={currentValue ? 'yes' : 'no'}
        onChange={(e) => onUpdate(userId, permission, e.target.value === 'yes')}
        disabled={isUpdating}
        className="w-full p-2 border border-border rounded-md text-sm bg-surface-2/50 text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <option value="yes">Oui</option>
        <option value="no">Non</option>
      </select>
      {isUpdating && (
        <div className="flex items-center text-xs text-primary">
          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
          Mise à jour...
        </div>
      )}
    </div>
  );
}

export function UsersOverview({
  users,
  currentUserData,
  isAdmin,
  updatingPermissions,
  onUpdatePermission,
  onOpenPasswordModal,
  onOpenDeleteModal,
}: UsersOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Vue d'ensemble de tous les utilisateurs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="glass-surface-static rounded-lg p-4 transition-colors duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{user.name || user.email}</span>
                    {user.id === currentUserData?.id && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Vous</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Modifié le {new Date(user.updated_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Poste:</strong> {user.position || 'Non défini'}</div>
                  <div><strong>Statut:</strong> {user.is_active ? 'Actif' : 'Inactif'}</div>
                </div>
                {isAdmin && user.email !== 'team@propulseo-site.com' && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Gestion des Accès</span>
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenPasswordModal(user.id, user.email)}
                          className="flex items-center space-x-1 text-orange-400 border-orange-600 hover:bg-orange-900/30"
                        >
                          <Key className="w-4 h-4" />
                          <span>Mot de passe</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenDeleteModal(user.id, user.name, user.email)}
                          className="flex items-center space-x-1 text-red-400 border-red-600 hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Supprimer</span>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {ALL_PERMISSIONS.map(perm => (
                        <PermissionField
                          key={perm.key}
                          userId={user.id}
                          permission={perm.key}
                          label={perm.label}
                          currentValue={(user[`can_${perm.key}`] as boolean) || false}
                          isUpdating={updatingPermissions.has(`${user.id}-${perm.key}`)}
                          onUpdate={onUpdatePermission}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
