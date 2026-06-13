# Spec — Calendrier Communication Premium

**Date :** 2026-04-14  
**Module cible :** `CommunicationManager` (V2 uniquement)  
**Remplace :** `CommCalendarView.tsx` (fait à la va-vite)

---

## 1. Contexte et objectif

L'équipe communication a besoin d'un espace d'organisation de ses tâches clients (posts, reels, newsletters, briefs…) avec une vue calendrier premium permettant de :
- Visualiser toutes les tâches par projet client et par date
- Glisser-déposer les tâches d'un jour à l'autre
- Filtrer par priorité, statut et projet
- Switcher entre 3 vues : Projets, Mois, Semaine

---

## 2. Modèle de données

### Nouvelle entité : `CommTask`

```ts
interface CommTask {
  id: string
  title: string
  project_id: string          // FK vers ProjectV2
  project_name: string        // dénormalisé pour affichage
  project_color: string       // couleur hex du projet
  status: 'todo' | 'in_progress' | 'done'
  priority: 'faible' | 'moyenne' | 'haute' | 'critique'
  due_date: string            // ISO date (YYYY-MM-DD)
  assigned_to?: string        // user_id optionnel
  created_at: string
  updated_at: string
}
```

**Stockage :** table Supabase `comm_tasks` (nouvelle migration). En attendant la migration, les données sont mockées dans `CommunicationManager/mocks/mockCommTasks.ts`.

---

## 3. Architecture des composants

```
CommunicationManager/
├── index.tsx                          # Layout principal — inchangé sauf import
└── components/
    ├── CommCalendarView.tsx           # Supprimé — remplacé par CommTaskBoard
    └── CommTaskBoard/
        ├── index.tsx                  # Composant racine : header + filtres + vues
        ├── CommTaskFilters.tsx        # Barre de filtres (priorité, statut, projet)
        ├── CommTaskBoardProject.tsx   # Vue Projets (kanban par projet)
        ├── CommTaskBoardMonth.tsx     # Vue Mois (grille calendrier)
        ├── CommTaskBoardWeek.tsx      # Vue Semaine (créneaux horaires)
        ├── CommTaskCard.tsx           # Carte tâche réutilisable (kanban)
        ├── CommTaskChip.tsx           # Chip tâche réutilisable (calendrier)
        ├── CommTaskModal.tsx          # Modal création/édition tâche
        └── useCommTasks.ts            # Hook : données + CRUD + filtres
```

---

## 4. Vues

### 4.1 Vue Projets (défaut)
- Colonnes par projet client (Docadoca, Locagame, La Clé, Etienne Perso, Murmure…)
- Chaque colonne : header coloré par projet + cartes tâches
- Carte : titre, date, badge priorité, badge statut
- Drag & drop entre colonnes via `@dnd-kit` (change le `project_id`)
- Bouton "+ Ajouter" en bas de chaque colonne

### 4.2 Vue Mois
- Grille 7 colonnes (Lun → Dim), dimanche masqué ou grisé
- Chip colorée par priorité avec tag projet abrégé (3 lettres)
- Max 2 chips visibles par jour → "+ N autres" cliquable
- Drag & drop entre jours via `@dnd-kit` (change le `due_date`)
- Clic sur jour vide → ouvre modal de création avec date pré-remplie
- Highlight jour actuel

### 4.3 Vue Semaine
- Grille horaire : créneaux 9h–18h, 6 jours (Lun–Sam)
- Événements positionnés verticalement par heure
- Drag & drop entre créneaux/jours (change `due_date`)
- Clic sur créneau vide → ouvre modal de création

---

## 5. Filtres

Barre de filtres persistante au-dessus des vues :
- **Priorité** (multi-select) : Critique 🔴 / Haute 🟠 / Moyenne 🟡 / Faible 🟢
- **Statut** (multi-select) : À faire / En cours / Terminé
- **Projet** (multi-select) : un chip par projet avec couleur
- Navigation période : ← Préc. | Mois actuel | Suiv. → | Aujourd'hui
- Bouton **+ Nouvelle tâche** (haut droite)

Les filtres s'appliquent aux 3 vues simultanément.

---

## 6. Modal tâche

Champs :
- Titre (required)
- Projet (select parmi projets comm actifs)
- Date (date picker)
- Priorité (radio : Faible / Moyenne / Haute / Critique)
- Statut (radio : À faire / En cours / Terminé)
- Assigné à (select parmi membres équipe, optionnel)

Actions : Créer / Sauvegarder / Supprimer

---

## 7. Drag & drop — comportement

**Librairie :** `@dnd-kit/core` + `@dnd-kit/sortable` (déjà dans le projet)

- Vue Projets : drag entre colonnes → met à jour `project_id`
- Vue Mois/Semaine : drag entre cellules → met à jour `due_date`
- Pendant le drag : opacité 50% sur la source, highlight pointillé violet sur la cible
- Au drop : mise à jour optimiste (UI immédiate) + sync Supabase/mock

---

## 8. Design tokens

Couleurs priorité (border-left des chips) :
- Critique : `#f87171` (fond `#1f1515`)
- Haute : `#fb923c` (fond `#1f1a10`)
- Moyenne : `#facc15` (fond `#1f1f10`)
- Faible : `#4ade80` (fond `#101f15`)

Statuts :
- À faire : `#64748b` (fond `#1e2535`)
- En cours : `#a78bfa` (fond `#1e1a2e`)
- Terminé : `#4ade80` (fond `#0d2e1a`)

Projets — palette auto-assignée à partir des couleurs existantes dans `CommunicationManager`.

---

## 9. Intégration dans `CommunicationManager/index.tsx`

Remplacer `<CommCalendarView>` par `<CommTaskBoard projects={projects}>`.  
Le composant est autonome (gère ses propres données via `useCommTasks`).

---

## 10. Ce qui est hors scope

- Synchronisation avec le module `Communication` (posts) : deux systèmes séparés
- Vue jour (zoom granulaire) : pas demandé
- Notifications/rappels : pas demandé
- Export PDF/CSV : pas demandé
