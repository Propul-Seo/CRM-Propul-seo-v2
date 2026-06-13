import { motion } from 'framer-motion';
import { Key, X, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

interface OwnPasswordModalProps {
  currentUserEmail: string;
  ownNewPassword: string;
  setOwnNewPassword: (v: string) => void;
  ownConfirmPassword: string;
  setOwnConfirmPassword: (v: string) => void;
  isUpdatingOwnPassword: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function OwnPasswordModal({
  currentUserEmail,
  ownNewPassword,
  setOwnNewPassword,
  ownConfirmPassword,
  setOwnConfirmPassword,
  isUpdatingOwnPassword,
  onClose,
  onSubmit,
}: OwnPasswordModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-surface-static rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center space-x-2 text-foreground">
            <Key className="w-5 h-5 text-orange-500" />
            <span>Modifier mon mot de passe</span>
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-primary">
              Vous êtes connecté en tant que <strong>{currentUserEmail}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownNewPassword">Nouveau mot de passe</Label>
            <Input
              id="ownNewPassword"
              type="password"
              value={ownNewPassword}
              onChange={(e) => setOwnNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              disabled={isUpdatingOwnPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownConfirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="ownConfirmPassword"
              type="password"
              value={ownConfirmPassword}
              onChange={(e) => setOwnConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              disabled={isUpdatingOwnPassword}
            />
          </div>

          {ownNewPassword && ownConfirmPassword && ownNewPassword !== ownConfirmPassword && (
            <p className="text-sm text-red-400">Les mots de passe ne correspondent pas</p>
          )}

          {ownNewPassword && ownNewPassword.length < 6 && (
            <p className="text-sm text-red-400">Le mot de passe doit contenir au moins 6 caractères</p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border bg-surface-1 rounded-b-lg">
          <Button variant="outline" onClick={onClose} disabled={isUpdatingOwnPassword}>
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isUpdatingOwnPassword || !ownNewPassword || ownNewPassword.length < 6 || ownNewPassword !== ownConfirmPassword}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isUpdatingOwnPassword ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Modification...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Modifier mon mot de passe
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
