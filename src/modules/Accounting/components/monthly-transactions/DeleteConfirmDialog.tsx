import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function DeleteConfirmDialog({ onConfirm, onCancel, loading }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface-2 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-medium text-foreground">
            Confirmer la suppression
          </h3>
        </div>
        <p className="text-muted-foreground mb-6">
          Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Supprimer
          </button>
          <button
            onClick={onCancel}
            className="bg-surface-3 text-foreground px-4 py-2 rounded-lg hover:bg-surface-3"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
