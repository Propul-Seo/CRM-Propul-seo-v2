import { motion } from 'framer-motion';
import { Trash2, X, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { DeleteModalState } from '../types';

interface DeleteUserModalProps {
  deleteModal: DeleteModalState;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteUserModal({ deleteModal, isDeleting, onClose, onConfirm }: DeleteUserModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-surface-static rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center space-x-2 text-foreground">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span>Supprimer l'utilisateur</span>
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-300 mb-2">
              <strong>Attention !</strong> Cette action est irréversible.
            </p>
            <p className="text-sm text-red-400">
              Vous êtes sur le point de supprimer l'utilisateur :
            </p>
            <div className="mt-2 p-2 bg-surface-2 rounded border border-red-700">
              <p className="font-medium text-foreground">{deleteModal.userName || 'Sans nom'}</p>
              <p className="text-sm text-muted-foreground">{deleteModal.userEmail}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            L'utilisateur sera supprimé de la base de données et ne pourra plus se connecter à l'application.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-border bg-surface-1 rounded-b-lg">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Confirmer la suppression
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
