# Dashboard V2 — Design Spec

**Date** : 2026-04-05  
**Status** : Approuvé  

---

## Contexte

Le Dashboard actuel (`src/modules/Dashboard/`) est basé sur l'ancienne architecture. Ce spec définit un nouveau module `DashboardV2` autonome qui le remplace progressivement, sans toucher à l'existant.

---

## Objectifs

- **Mission** : Mix KPIs + Actions prioritaires (vue quotidienne d'équipe)
- **Cas d'usage principal** : arriver le matin, voir en un coup d'œil ce qui brûle et les chiffres clés, agir directement sans changer de module

---

## Layout

**Bento grid 2 colonnes** (`grid-cols-1 md:grid-cols-[2fr_1fr]`), responsive :
- Desktop : colonne gauche large (actions + IA + graphique), colonne droite étroite (KPIs + agenda + tâches)
- Mobile : colonne droite en premier (KPIs + agenda), colonne gauche en dessous

---

## Structure des fichiers

```
src/modules/DashboardV2/
├── index.tsx                          # Entry point, layout bento grid
├── hooks/
│   ├── useDashboardRealtime.ts        # Subscriptions Supabase realtime centralisées
│   └── useDashboardData.ts            # Agrégation des données au chargement
├── components/
│   ├── BentoGrid.tsx                  # Layout 2 colonnes responsive
│   ├── left/
│   │   ├── PriorityActionsWidget.tsx  # Actions urgentes + mini-actions inline
│   │   ├── AiSummariesWidget.tsx      # Résumés IA par projet (refactor AiSummariesSection)
│   │   └── RevenueChartWidget.tsx     # Graphique CA mensuel (Recharts)
│   └── right/
│       ├── KpiStatsWidget.tsx         # 4 KPIs live avec animation
│       ├── UpcomingMeetingsWidget.tsx # RDV à venir J+7 (refactor UpcomingMeetingsCard)
│       └── QuickTasksWidget.tsx       # Tâches du jour avec checkbox inline
```

---

## Données & Realtime

### Supabase realtime

`useDashboardRealtime.ts` centralise toutes les subscriptions en une seule connexion WebSocket via `DashboardRealtimeContext`. Tables écoutées :
- `projects` → KPI projets + résumés IA
- `tasks` → tâches urgentes + QuickTasks
- `clients` → leads KPI
- `project_activities_v2` (type `meeting`) → agenda RDV

### Données au chargement (`useDashboardData.ts`)

| Donnée | Source |
|--------|--------|
| KPI projets | `count(projects where status != 'termine')` |
| KPI leads | `count(clients where status = 'prospect')` |
| KPI CA | `sum(accounting_entries)` du mois courant |
| Actions urgentes | projets `completion_score < 50` + tâches overdue + devis en attente |
| Résumés IA | `projects.ai_summary` (existant) |
| RDV | `project_activities_v2 where type='meeting' and date >= today` |

Pas de nouveaux endpoints Supabase — tout via les hooks CRUD existants.

---

## Widgets

### Colonne gauche

**`PriorityActionsWidget`**
- Liste d'actions urgentes triées par criticité (rouge → orange → jaune)
- Badge type : Devis / Tâche / Budget
- Bouton d'action inline par item
- Max 5 items, lien "Voir tout" si plus

**`AiSummariesWidget`**
- Cartes projet avec barre de progression (`completion_score`)
- Texte `ai_summary`, indicateur couleur (vert/orange/rouge)
- Clic → navigation `ProjectDetailsV2`
- Refactorisation de `AiSummariesSection` existant

**`RevenueChartWidget`**
- Graphique CA mensuel (Recharts, ligne simple)
- Visible en bas desktop, caché sur mobile

### Colonne droite

**`KpiStatsWidget`**
- 4 tuiles : Projets actifs / Leads en cours / Tâches du jour / CA du mois
- Mise à jour live avec animation au changement (`Framer Motion AnimatePresence`)

**`UpcomingMeetingsWidget`**
- RDV à venir sur J+7
- Refactorisation de `UpcomingMeetingsCard` existant, adapté en widget compact

**`QuickTasksWidget`**
- Tâches assignées à l'utilisateur connecté, dues aujourd'hui
- Checkbox inline → `useTasksCRUD().updateTask({ status: 'done' })` immédiat
- Item barré visuellement après complétion (optimistic update)

---

## Mini-actions inline

Chaque widget peut déclencher des actions sans quitter le dashboard :

| Widget | Action | Hook utilisé |
|--------|--------|--------------|
| QuickTasksWidget | Cocher une tâche | `useTasksCRUD().updateTask` |
| PriorityActionsWidget | Marquer action traitée | `useTasksCRUD().updateTask` |
| PriorityActionsWidget (devis) | Naviguer vers lead | `handleNavigateToModule('CRMERPLeadDetails', id)` |
| UpcomingMeetingsWidget | Naviguer vers projet | `handleNavigateToProject(id)` |

---

## États de chargement & erreurs

**Loading** : skeleton par widget (shadcn/ui `<Skeleton>`). Le bento grid s'affiche immédiatement, les données arrivent widget par widget.

**Erreurs locales** : chaque widget gère ses erreurs indépendamment. Badge `⚠ Erreur de chargement — Réessayer` en bas du widget concerné. Pas de crash global.

**Realtime déconnecté** : bandeau discret en haut du dashboard : `⚡ Données en temps réel indisponibles — dernière mise à jour il y a X min`. Données déjà chargées restent visibles.

**Optimistic updates** : les mini-actions appliquent le changement immédiatement en UI. Si l'appel Supabase échoue → rollback + toast d'erreur via `useNotifications`.

---

## Responsive

| Breakpoint | Comportement |
|-----------|-------------|
| Mobile (`< md`) | Colonne droite (KPIs + agenda) en premier, colonne gauche en dessous |
| Desktop (`>= md`) | Bento grid `2fr / 1fr`, tout visible sans scroll horizontal |

---

## Ce qui est réutilisé (ne pas recréer)

- `AiSummariesSection` → refactorisé en `AiSummariesWidget`
- `UpcomingMeetingsCard` → refactorisé en `UpcomingMeetingsWidget`
- `handleNavigateToProject` pattern (ProjectsManagerV2)
- Tous les hooks CRUD existants (`useTasksCRUD`, `useProjectsCRUD`, etc.)
- Système de notifications existant (`useNotifications`)
- Composants shadcn/ui : `Skeleton`, `Badge`, `Card`, `Checkbox`
