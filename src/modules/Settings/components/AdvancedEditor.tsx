import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import type { UserType } from '../types';

interface AdvancedEditorProps {
  currentUserData: UserType;
  updateField: (field: keyof UserType, value: UserType[keyof UserType]) => void;
}

export function AdvancedEditor({ currentUserData, updateField }: AdvancedEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Éditeur avancé - Tous les champs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avatar_url">URL de l'avatar</Label>
              <Input
                id="avatar_url"
                value={currentUserData.avatar_url || ''}
                onChange={(e) => updateField('avatar_url', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input
                id="role"
                value={currentUserData.role || ''}
                onChange={(e) => updateField('role', e.target.value)}
                placeholder="admin, user, manager..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_login">Dernière connexion</Label>
              <Input
                id="last_login"
                type="datetime-local"
                value={currentUserData.last_login ? new Date(currentUserData.last_login).toISOString().slice(0, 16) : ''}
                onChange={(e) => updateField('last_login', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="created_at">Date de création</Label>
              <Input
                id="created_at"
                value={new Date(currentUserData.created_at).toLocaleString('fr-FR')}
                disabled
                className="bg-surface-2 text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="updated_at">Dernière modification</Label>
            <Input
              id="updated_at"
              value={new Date(currentUserData.updated_at).toLocaleString('fr-FR')}
              disabled
              className="bg-surface-2 text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
