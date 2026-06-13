# Module TaskManager

## Description
Ce module gère la gestion des tâches : affichage, création, édition et suivi des tâches.

## Structure
- `index.tsx` : Entrée principale du module TaskManager
- `TaskManagerList.tsx` : Sous-composant pour lister les tâches
- `TaskManagerDetails.tsx` : Sous-composant pour afficher les détails d'une tâche
- `types.ts` : Types TypeScript spécifiques aux tâches
- `__tests__/` : Tests unitaires des sous-composants

## Utilisation
Importer le module ou ses sous-composants dans votre code :
```tsx
import { TaskManagerList } from '@/modules/TaskManager/TaskManagerList';
import { TaskManagerDetails } from '@/modules/TaskManager/TaskManagerDetails';
import type { Task } from '@/modules/TaskManager/types';

const tasks: Task[] = [
  { id: '1', title: 'Faire la maquette', status: 'todo' },
  { id: '2', title: 'Déployer', status: 'done' },
];

function MyTasksPage() {
  const [selected, setSelected] = React.useState<Task|null>(null);
  return (
    <div>
      <TaskManagerList tasks={tasks} onSelect={setSelected} />
      {selected && <TaskManagerDetails task={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
```

## Tests unitaires
Les tests sont situés dans `__tests__/`. Exemple :
```ts
import { render, screen } from '@testing-library/react';
import { TaskManagerList } from '../TaskManagerList';
// ...
```

## Points d’extension
- Ajouter des sous-composants pour la création/édition de tâche
- Ajouter des hooks personnalisés si besoin

## Auteur
À compléter 