import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import type { UserType } from '../types';

interface ProfileInfoCardProps {
  currentUserData: UserType;
  updateField: (field: keyof UserType, value: UserType[keyof UserType]) => void;
}

export function ProfileInfoCard({ currentUserData, updateField }: ProfileInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Informations personnelles</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <Label htmlFor="avatar">Photo de profil</Label>
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden">
                  {currentUserData?.avatar_url ? (
                    <img
                      src={currentUserData.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {currentUserData?.name?.charAt(0)?.toUpperCase() ||
                       currentUserData?.email?.charAt(0)?.toUpperCase() ||
                       'U'}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    id="avatar"
                    type="url"
                    value={currentUserData?.avatar_url || ''}
                    onChange={(e) => updateField('avatar_url', e.target.value)}
                    placeholder="https://exemple.com/photo.jpg"
                    className="w-64"
                  />
                  <p className="text-xs text-muted-foreground">
                    Entrez l'URL d'une image pour votre photo de profil
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={currentUserData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Votre nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={currentUserData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={currentUserData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Poste</Label>
              <Input
                id="position"
                value={currentUserData.position || ''}
                onChange={(e) => updateField('position', e.target.value)}
                placeholder="Votre poste dans l'entreprise"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              value={currentUserData.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={3}
              placeholder="Parlez-nous de vous..."
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
