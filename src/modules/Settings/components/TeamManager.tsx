import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  RefreshCw,
  Shield,
  Power,
  PowerOff,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { User as UserType } from '../../../hooks/useUsers';
import { CreateUserModal } from './CreateUserModal';

interface TeamManagerProps {
  users: UserType[];
  onRefresh: () => void;
  loading: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Commercial',
  ops: 'Opérations',
  marketing: 'Marketing',
  developer: 'Dev',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400',
  manager: 'bg-purple-500/15 text-purple-400',
  sales: 'bg-blue-500/15 text-blue-400',
  ops: 'bg-yellow-500/15 text-yellow-400',
  marketing: 'bg-green-500/15 text-green-400',
  developer: 'bg-cyan-500/15 text-cyan-400',
};

export function TeamManager({ users, onRefresh, loading }: TeamManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string, currentlyActive: boolean) => {
    setTogglingUserId(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Session non valide');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-toggle-user-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ targetUserId: userId, active: !currentlyActive }),
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success(result.message);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setTogglingUserId(null);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    // Admin first, then by active status, then by name
    if (a.email === 'team@propulseo-site.com') return -1;
    if (b.email === 'team@propulseo-site.com') return 1;
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return (a.name || a.email).localeCompare(b.name || b.email);
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Gestion de l'équipe</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({users.length} membre{users.length > 1 ? 's' : ''})
                </span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/5">
              <div className="col-span-3">Nom</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Rôle</div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-2">Créé le</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-white/5">
              {sortedUsers.map((user) => {
                const isMainAdmin = user.email === 'team@propulseo-site.com';
                const isToggling = togglingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 items-center transition-colors hover:bg-white/[0.02] rounded-lg ${
                      !user.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Name */}
                    <div className="col-span-3 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-sm font-medium text-purple-400">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name || 'Sans nom'}
                        </p>
                        {user.position && (
                          <p className="text-xs text-muted-foreground truncate">{user.position}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3">
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Role */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        ROLE_COLORS[user.role] || 'bg-white/5 text-muted-foreground'
                      }`}>
                        {isMainAdmin && <Shield className="w-3 h-3 mr-1" />}
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        user.is_active
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    {/* Created at */}
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end">
                      {!isMainAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, !!user.is_active)}
                          disabled={isToggling}
                          title={user.is_active ? 'Désactiver' : 'Activer'}
                          className={user.is_active
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                          }
                        >
                          {isToggling ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : user.is_active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {users.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            onRefresh();
          }}
        />
      )}
    </>
  );
}
