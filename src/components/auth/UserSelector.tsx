import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Briefcase, Megaphone, Code } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { User as UserType } from '@/types';

const userProfiles: UserType[] = [
  {
    id: '1',
    name: 'Etienne',
    email: 'etienne@propulseo.com',
    role: 'admin',
    isActive: true,
    permissions: [
      { module: 'all', actions: ['read', 'write', 'delete', 'admin'] }
    ],
  },
  {
    id: '2',
    name: 'Paul',
    email: 'paul@propulseo.com',
    role: 'developer',
    isActive: true,
    permissions: [
      { module: 'all', actions: ['read', 'write', 'delete', 'admin'] }
    ],
  },
  {
    id: '3',
    name: 'Antoine',
    email: 'antoine@propulseo.com',
    role: 'sales',
    isActive: true,
    permissions: [
      { module: 'all', actions: ['read', 'write', 'delete', 'admin'] }
    ],
  },
  {
    id: '4',
    name: 'Baptiste',
    email: 'baptiste@propulseo.com',
    role: 'sales',
    isActive: true,
    permissions: [
      { module: 'all', actions: ['read', 'write', 'delete', 'admin'] }
    ],
  },
];

const roleLabels = {
  admin: 'Administrateur',
  developer: 'Développeur',
  marketing: 'Marketing',
  sales: 'Commercial',
  manager: 'Manager',
};

const roleIcons = {
  admin: Shield,
  developer: Code,
  marketing: Megaphone,
  sales: Briefcase,
  manager: User,
};

const roleColors = {
  admin: 'from-red-500 to-red-600',
  developer: 'from-blue-500 to-blue-600',
  marketing: 'from-purple-500 to-purple-600',
  sales: 'from-green-500 to-green-600',
  manager: 'from-slate-500 to-slate-600',
};

const roleDescriptions = {
  admin: 'Accès complet à toutes les fonctionnalités',
  developer: 'Développement et gestion technique',
  marketing: 'Commercial et marketing digital',
  sales: 'Commercial et suivi client',
  manager: 'Vue d\'ensemble et gestion d\'équipe',
};

interface UserSelectorProps {
  onUserSelect: (user: UserType) => void;
}

export function UserSelector({ onUserSelect }: UserSelectorProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user.id);
    setTimeout(() => {
      onUserSelect(user);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-surface-2">
              <img 
                src="https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0"
                alt="Propulseo Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Bienvenue sur Propulseo CRM
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez votre profil pour accéder à votre espace de travail personnalisé
          </p>
        </motion.div>

        {/* User Cards - Taille uniforme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userProfiles.map((user, index) => {
            const RoleIcon = roleIcons[user.role];
            const isSelected = selectedUser === user.id;
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full" // Assure une hauteur uniforme
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 h-full flex flex-col ${
                    isSelected 
                      ? 'border-violet-500 shadow-lg scale-105' 
                      : 'border-border hover:border-violet-300'
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Avatar et rôle - Section fixe */}
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-center shadow-lg`}>
                        <RoleIcon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {user.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className="mb-3 bg-violet-100 text-violet-700"
                      >
                        {roleLabels[user.role]}
                      </Badge>
                      <p className="text-sm text-muted-foreground leading-relaxed min-h-[2.5rem] flex items-center justify-center">
                        {roleDescriptions[user.role]}
                      </p>
                    </div>

                    {/* Permissions preview - Section flexible */}
                    <div className="space-y-3 flex-1">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        Accès aux modules :
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                          <span>Tous les modules</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                          <span>Accès complet</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                          <span>Lecture & écriture</span>
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator - Section fixe en bas */}
                    <div className="mt-4">
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-center"
                        >
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                            <div className="w-2 h-2 bg-violet-500 rounded-full mr-2 animate-pulse"></div>
                            Connexion en cours...
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            Propulseo CRM - Gestion d'agence SEO & Marketing Digital
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Version 1.0 - 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
}