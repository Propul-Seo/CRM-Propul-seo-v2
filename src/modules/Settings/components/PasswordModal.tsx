import { motion } from 'framer-motion';
import { Key, X, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import type { PasswordModalState } from '../types';

interface PasswordModalProps {
  passwordModal: PasswordModalState;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  isUpdatingPassword: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function PasswordModal({
  passwordModal,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isUpdatingPassword,
  onClose,
  onSubmit,
}: PasswordModalProps) {
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
            <span>Modifier le mot de passe</span>
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-primary">
              <strong>Utilisateur :</strong> {passwordModal.userEmail}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              disabled={isUpdatingPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              disabled={isUpdatingPassword}
            />
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-red-400">Les mots de passe ne correspondent pas</p>
          )}

          {newPassword && newPassword.length < 6 && (
            <p className="text-sm text-red-400">Le mot de passe doit contenir au moins 6 caractères</p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border bg-surface-1 rounded-b-lg">
          <Button variant="outline" onClick={onClose} disabled={isUpdatingPassword}>
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isUpdatingPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isUpdatingPassword ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Modification...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Modifier le mot de passe
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
