# Module DashboardV3

## Description
Tableau de bord principal du CRM (V3). Affiche les KPIs de l'agence : chiffre
d'affaires de l'année, contacts/leads, projets actifs, pipeline commercial,
graphique de revenus et objectifs. Mode « privacy » pour masquer les montants.

## Structure
- `index.tsx` : composant racine `DashboardV3` — assemble la grille de cartes
- `hooks/useDashboardData.ts` : agrège les données (compta, projets, leads, objectifs)
- `components/` : cartes et sections (`RevenueCard`, `ContactsCard`, `ProjectsCard`,
  `PipelineBoardSection`, `RevenueChartSection`, `ObjectivesSection`, `DashboardHeader`,
  `AnimatedNumber`, `RevenueChartSection`, …)
- `ObjectivesModal.tsx` : édition des objectifs annuels
- `lib/animations.ts` : variants Framer Motion partagés

## Utilisation
```tsx
import { DashboardV3 } from '@/modules/DashboardV3';

// Rendu directement par le routeur principal (lazy-loaded dans Layout).
<DashboardV3 />
```

## Points d'extension
- Ajouter une carte : créer un composant dans `components/`, exposer sa donnée
  depuis `useDashboardData`, puis l'insérer dans la grille de `index.tsx`.
- Les objectifs sont persistés via le store (`dashboardObjectives`).
