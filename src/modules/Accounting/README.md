# Module Accounting

## Description
Ce module gère la gestion comptable : affichage, création, édition et suivi des écritures (revenus/dépenses).

## Structure
- `index.tsx` : Entrée principale du module Accounting
- `AccountingList.tsx` : Sous-composant pour lister les écritures
- `AccountingDetails.tsx` : Sous-composant pour afficher les détails d’une écriture
- `types.ts` : Types TypeScript spécifiques aux écritures
- `__tests__/` : Tests unitaires des sous-composants

## Utilisation
Importer le module ou ses sous-composants dans votre code :
```tsx
import { AccountingList } from '@/modules/Accounting/AccountingList';
import { AccountingDetails } from '@/modules/Accounting/AccountingDetails';
import type { AccountingEntry } from '@/modules/Accounting/types';

const entries: AccountingEntry[] = [
  { id: '1', label: 'Facture client', amount: 2000, date: '2024-01-01', type: 'income' },
  { id: '2', label: 'Achat matériel', amount: 500, date: '2024-01-02', type: 'expense' },
];

function MyAccountingPage() {
  const [selected, setSelected] = React.useState<AccountingEntry|null>(null);
  return (
    <div>
      <AccountingList entries={entries} onSelect={setSelected} />
      {selected && <AccountingDetails entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
```

## Tests unitaires
Les tests sont situés dans `__tests__/`. Exemple :
```ts
import { render, screen } from '@testing-library/react';
import { AccountingList } from '../AccountingList';
// ...
```

## Points d’extension
- Ajouter des sous-composants pour la génération de rapports
- Ajouter des hooks personnalisés si besoin

## Auteur
À compléter 