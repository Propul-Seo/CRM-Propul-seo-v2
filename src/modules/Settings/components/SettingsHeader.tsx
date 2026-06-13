import { motion } from 'framer-motion';
import { RefreshCw, Save, Database } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface SettingsHeaderProps {
  isLoading: boolean;
  isSaving: boolean;
  showAdvanced: boolean;
  currentUserData: unknown;
  onRefresh: () => void;
  onSave: () => void;
  onToggleAdvanced: () => void;
}

export function SettingsHeader({
  isLoading,
  isSaving,
  showAdvanced,
  currentUserData,
  onRefresh,
  onSave,
  onToggleAdvanced,
}: SettingsHeaderProps) {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon Profil</h1>
        <p className="text-muted-foreground mt-2">Gérez vos informations personnelles</p>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button onClick={onSave} disabled={isSaving || !currentUserData}>
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder
        </Button>
        <Button variant={showAdvanced ? 'default' : 'outline'} onClick={onToggleAdvanced}>
          <Database className="h-4 w-4 mr-2" />
          {showAdvanced ? 'Mode Simple' : 'Mode Avancé'}
        </Button>
      </div>
    </motion.div>
  );
}
