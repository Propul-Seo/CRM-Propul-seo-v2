import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import type { UserType } from '../types';

interface PreferencesCardProps {
  currentUserData: UserType;
  updateField: (field: keyof UserType, value: UserType[keyof UserType]) => void;
}

export function PreferencesCard({ currentUserData, updateField }: PreferencesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Préférences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <select
                id="language"
                value={currentUserData.language || 'fr'}
                onChange={(e) => updateField('language', e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-surface-2/50 text-foreground transition-colors duration-200"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <select
                id="timezone"
                value={currentUserData.timezone || 'Europe/Paris'}
                onChange={(e) => updateField('timezone', e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-surface-2/50 text-foreground transition-colors duration-200"
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={currentUserData.is_active || false}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="rounded"
              />
              <span>Compte actif</span>
            </Label>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
