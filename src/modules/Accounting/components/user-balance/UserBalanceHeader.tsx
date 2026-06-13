import { DollarSign } from 'lucide-react';

interface UserBalanceHeaderProps {
  onRefresh: () => void;
}

export function UserBalanceHeader({ onRefresh }: UserBalanceHeaderProps) {
  return (
    <div className="bg-surface-2 rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          Bilan par Utilisateur
        </h2>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          <DollarSign className="h-4 w-4" />
          <span>Actualiser</span>
        </button>
      </div>
      <p className="text-muted-foreground">
        Vue d'ensemble des revenus et dépenses par utilisateur
      </p>
    </div>
  );
}
